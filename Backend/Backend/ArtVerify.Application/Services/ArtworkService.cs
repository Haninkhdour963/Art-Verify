using ArtVerify.Application.DTOs;
using ArtVerify.Application.Interfaces;
using ArtVerify.Domain.Entities;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;

namespace ArtVerify.Application.Services
{
    public class ArtworkService : IArtworkService
    {
        private readonly IArtworkRepository _artworkRepository;
        private readonly IFileService _fileService;
        private readonly IHederaService _hederaService;
        private readonly IImageService _imageService;
        private readonly IMemoryCache _cache;
        private readonly ILogger<ArtworkService> _logger;

        public ArtworkService(IArtworkRepository artworkRepository, IFileService fileService,
            IHederaService hederaService, IImageService imageService, IMemoryCache cache,
            ILogger<ArtworkService> logger)
        {
            _artworkRepository = artworkRepository ?? throw new ArgumentNullException(nameof(artworkRepository));
            _fileService = fileService ?? throw new ArgumentNullException(nameof(fileService));
            _hederaService = hederaService ?? throw new ArgumentNullException(nameof(hederaService));
            _imageService = imageService ?? throw new ArgumentNullException(nameof(imageService));
            _cache = cache ?? throw new ArgumentNullException(nameof(cache));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public async Task<ArtworkDto> UploadArtworkAsync(CreateArtworkDto createArtworkDto, int userId)
        {
            try
            {
                // Validate input parameters
                if (createArtworkDto == null)
                    throw new ArgumentNullException(nameof(createArtworkDto), "CreateArtworkDto cannot be null");

                if (createArtworkDto.File == null)
                    throw new ArgumentException("File cannot be null", nameof(createArtworkDto.File));

                if (userId <= 0)
                    throw new ArgumentException("Invalid user ID", nameof(userId));

                _logger.LogInformation("Starting artwork upload for user {UserId}", userId);

                // Compute file hash
                var sha256Hash = await _fileService.ComputeSHA256HashAsync(createArtworkDto.File);

                _logger.LogInformation("Computed SHA256 hash: {Hash}", sha256Hash);

                // Check if artwork already exists
                var existingArtwork = await _artworkRepository.GetBySHA256HashAsync(sha256Hash);
                if (existingArtwork != null)
                    throw new Exception("Artwork with the same hash already exists");

                // Create artwork entity first to get ID
                var artwork = new Artwork
                {
                    UserId = userId,
                    FileName = createArtworkDto.File.FileName ?? "unknown",
                    FileType = createArtworkDto.File.ContentType ?? "application/octet-stream",
                    FileSize = createArtworkDto.File.Length,
                    SHA256Hash = sha256Hash,
                    CreatedAt = DateTime.UtcNow,
                    IsListedForSale = false,
                    SalePrice = null
                };

                // Save artwork to get ID
                await _artworkRepository.AddArtworkAsync(artwork);
                await _artworkRepository.SaveChangesAsync();

                _logger.LogInformation("Artwork saved with ID: {ArtworkId}", artwork.Id);

                // Save image file using the artwork ID
                string imagePath = null;
                try
                {
                    imagePath = await _imageService.SaveImageAsync(createArtworkDto.File, artwork.Id, artwork.FileName);
                    artwork.ImagePath = imagePath;

                    // Update artwork with image path
                    await _artworkRepository.UpdateArtworkAsync(artwork);
                    await _artworkRepository.SaveChangesAsync();

                    _logger.LogInformation("Image saved at path: {ImagePath}", imagePath);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to save image for artwork {ArtworkId}", artwork.Id);
                    // Don't throw - we still have the artwork record without image
                }

                // Register on blockchain if requested
                string transactionId = "NOT_REGISTERED";
                if (createArtworkDto.UseBlockchain)
                {
                    try
                    {
                        var hederaResult = await _hederaService.RegisterArtworkHashAsync(sha256Hash, createArtworkDto.File.FileName ?? "artwork");
                        if (hederaResult.Success && !string.IsNullOrEmpty(hederaResult.TransactionId))
                        {
                            transactionId = hederaResult.TransactionId;

                            var hederaRecord = new HederaRecord
                            {
                                ArtworkId = artwork.Id,
                                TransactionId = hederaResult.TransactionId,
                                ConsensusTimestamp = DateTime.UtcNow,
                                Memo = $"Artwork registration: {createArtworkDto.File.FileName}",
                                NodeStatus = "SUCCESS",
                                RecordedAt = DateTime.UtcNow
                            };
                            await _artworkRepository.AddHederaRecordAsync(hederaRecord);
                            await _artworkRepository.SaveChangesAsync();

                            _logger.LogInformation("Artwork registered on blockchain with transaction: {TransactionId}", transactionId);
                        }
                        else
                        {
                            _logger.LogWarning("Blockchain registration failed: {Error}", hederaResult.Error);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error registering artwork on blockchain for artwork {ArtworkId}", artwork.Id);
                        // Continue without blockchain registration
                    }
                }

                // Generate image URL
                var imageUrl = _imageService.GetImageUrl(artwork.ImagePath);

                // Create response DTO
                var result = new ArtworkDto
                {
                    Id = artwork.Id,
                    FileName = artwork.FileName,
                    FileType = artwork.FileType,
                    FileSize = artwork.FileSize,
                    SHA256Hash = artwork.SHA256Hash,
                    ImageUrl = imageUrl,
                    ImagePath = artwork.ImagePath,
                    CreatedAt = artwork.CreatedAt,
                    IsListedForSale = artwork.IsListedForSale,
                    SalePrice = artwork.SalePrice,
                    TransactionId = transactionId,
                    User = new UserDto
                    {
                        Id = userId,
                        Username = "Current User",
                        Email = "",
                        Role = "Seller",
                        CreatedAt = DateTime.UtcNow
                    }
                };

                // Clear relevant caches
                _cache.Remove($"user_artworks_{userId}");
                _cache.Remove("marketplace_artworks");
                _cache.Remove($"seller_stats_{userId}");

                _logger.LogInformation("Artwork upload completed successfully for user {UserId}", userId);
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading artwork for user {UserId}", userId);
                throw;
            }
        }

        public async Task<VerificationResultDto> VerifyArtworkAsync(VerifyArtworkDto verifyDto)
        {
            try
            {
                if (verifyDto == null)
                    throw new ArgumentNullException(nameof(verifyDto));

                Artwork? artwork = null;

                if (!string.IsNullOrEmpty(verifyDto.FileHash))
                {
                    artwork = await _artworkRepository.GetBySHA256HashAsync(verifyDto.FileHash);
                }
                else if (!string.IsNullOrEmpty(verifyDto.TransactionId))
                {
                    artwork = await _artworkRepository.GetByTransactionIdAsync(verifyDto.TransactionId);
                }
                else if (verifyDto.File != null)
                {
                    var fileHash = await _fileService.ComputeSHA256HashAsync(verifyDto.File);
                    artwork = await _artworkRepository.GetBySHA256HashAsync(fileHash);
                }

                if (artwork != null)
                {
                    var imageUrl = _imageService.GetImageUrl(artwork.ImagePath);
                    return new VerificationResultDto
                    {
                        IsVerified = true,
                        Message = "Artwork verified successfully",
                        Artwork = MapToDto(artwork, imageUrl)
                    };
                }

                return new VerificationResultDto
                {
                    IsVerified = false,
                    Message = "Artwork not found in the system"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verifying artwork");
                throw;
            }
        }

        public async Task<IEnumerable<ArtworkDto>> GetUserArtworksAsync(int userId)
        {
            try
            {
                if (userId <= 0)
                    throw new ArgumentException("Invalid user ID", nameof(userId));

                var artworks = await _artworkRepository.GetUserArtworksAsync(userId);
                return artworks.Select(artwork =>
                {
                    var imageUrl = _imageService.GetImageUrl(artwork.ImagePath);
                    return MapToDto(artwork, imageUrl);
                }).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user artworks for user {UserId}", userId);
                throw;
            }
        }

        public async Task<IEnumerable<ArtworkDto>> GetMarketplaceArtworksAsync()
        {
            try
            {
                var artworks = await _artworkRepository.GetMarketplaceArtworksAsync();
                return artworks.Select(artwork =>
                {
                    var imageUrl = _imageService.GetImageUrl(artwork.ImagePath);
                    return MapToDto(artwork, imageUrl);
                }).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting marketplace artworks");
                throw;
            }
        }

        public async Task<IEnumerable<ArtworkDto>> GetPurchasedArtworksAsync(int userId)
        {
            try
            {
                if (userId <= 0)
                    throw new ArgumentException("Invalid user ID", nameof(userId));

                var artworks = await _artworkRepository.GetPurchasedArtworksAsync(userId);
                return artworks.Select(artwork =>
                {
                    var imageUrl = _imageService.GetImageUrl(artwork.ImagePath);
                    return MapToDto(artwork, imageUrl);
                }).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting purchased artworks for user {UserId}", userId);
                throw;
            }
        }

        public async Task<ArtworkDto> ListForSaleAsync(int artworkId, decimal price, int userId)
        {
            try
            {
                if (artworkId <= 0)
                    throw new ArgumentException("Invalid artwork ID", nameof(artworkId));

                if (userId <= 0)
                    throw new ArgumentException("Invalid user ID", nameof(userId));

                var artwork = await _artworkRepository.GetByIdAsync(artworkId);
                if (artwork == null)
                    throw new Exception("Artwork not found");

                if (artwork.UserId != userId)
                    throw new Exception("You can only list your own artworks for sale");

                artwork.IsListedForSale = true;
                artwork.SalePrice = price;

                await _artworkRepository.UpdateArtworkAsync(artwork);
                await _artworkRepository.SaveChangesAsync();

                // Clear relevant caches
                _cache.Remove($"user_artworks_{userId}");
                _cache.Remove("marketplace_artworks");
                _cache.Remove($"seller_stats_{userId}");

                var imageUrl = _imageService.GetImageUrl(artwork.ImagePath);
                return MapToDto(artwork, imageUrl);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error listing artwork {ArtworkId} for sale by user {UserId}", artworkId, userId);
                throw;
            }
        }

        public async Task<PurchaseResultDto> PurchaseArtworkAsync(int artworkId, int userId)
        {
            try
            {
                if (artworkId <= 0)
                    throw new ArgumentException("Invalid artwork ID", nameof(artworkId));

                if (userId <= 0)
                    throw new ArgumentException("Invalid user ID", nameof(userId));

                var artwork = await _artworkRepository.GetByIdAsync(artworkId);
                if (artwork == null)
                    throw new Exception("Artwork not found");

                if (artwork.UserId == userId)
                    throw new Exception("You cannot purchase your own artwork");

                if (!artwork.IsListedForSale || artwork.SalePrice == null || artwork.SalePrice <= 0)
                    throw new Exception("Artwork is not available for purchase");

                // Check if user already purchased this artwork
                var hasPurchased = await _artworkRepository.HasUserPurchasedArtworkAsync(userId, artworkId);
                if (hasPurchased)
                    throw new Exception("You have already purchased this artwork");

                // Get buyer and seller account information
                var buyerAccountId = "0.0.6945291"; // Marketplace account
                var sellerAccountId = $"0.0.{1000000 + artwork.UserId}"; // Simulated seller account
                var purchaseAmount = artwork.SalePrice.Value;

                // Check buyer's balance
                var buyerBalance = await _hederaService.GetAccountBalanceAsync(buyerAccountId);
                if (buyerBalance < purchaseAmount)
                    throw new Exception($"Insufficient HBAR balance. Required: {purchaseAmount} HBAR, Available: {buyerBalance} HBAR");

                // Process HBAR payment on Hedera network
                var paymentResult = await _hederaService.ProcessPurchaseAsync(buyerAccountId, sellerAccountId, purchaseAmount);

                if (!paymentResult.Success)
                    throw new Exception($"Payment failed: {paymentResult.Error}");

                // Create purchase record
                var purchase = new ArtworkPurchase
                {
                    ArtworkId = artworkId,
                    BuyerId = userId,
                    PurchasePrice = purchaseAmount,
                    PurchaseDate = DateTime.UtcNow,
                    TransactionId = paymentResult.TransactionId
                };

                await _artworkRepository.AddPurchaseRecordAsync(purchase);
                await _artworkRepository.SaveChangesAsync();

                _logger.LogInformation("Artwork {ArtworkId} purchased by user {UserId} for {Amount} HBAR. Transaction: {TransactionId}",
                    artworkId, userId, purchaseAmount, paymentResult.TransactionId);

                // Clear relevant caches
                _cache.Remove("marketplace_artworks");
                _cache.Remove($"purchased_artworks_{userId}");
                _cache.Remove($"user_artworks_{artwork.UserId}");
                _cache.Remove($"seller_stats_{artwork.UserId}");

                var imageUrl = _imageService.GetImageUrl(artwork.ImagePath);
                var artworkDto = MapToDto(artwork, imageUrl);

                return new PurchaseResultDto
                {
                    Success = true,
                    Message = "Artwork purchased successfully!",
                    Artwork = artworkDto,
                    TransactionId = paymentResult.TransactionId,
                    AmountHbar = purchaseAmount
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error purchasing artwork {ArtworkId} by user {UserId}", artworkId, userId);
                throw;
            }
        }

        public async Task<ArtworkDownloadDto> GetArtworkForDownloadAsync(int artworkId, int userId)
        {
            try
            {
                if (artworkId <= 0)
                    throw new ArgumentException("Invalid artwork ID", nameof(artworkId));

                if (userId <= 0)
                    throw new ArgumentException("Invalid user ID", nameof(userId));

                var artwork = await _artworkRepository.GetByIdAsync(artworkId);
                if (artwork == null)
                    return null;

                // Check if user owns the artwork or has purchased it
                if (artwork.UserId != userId)
                {
                    var hasPurchased = await _artworkRepository.HasUserPurchasedArtworkAsync(userId, artworkId);
                    if (!hasPurchased)
                        throw new Exception("You do not have permission to download this artwork");
                }

                return new ArtworkDownloadDto
                {
                    Id = artwork.Id,
                    FileName = artwork.FileName ?? "artwork",
                    FileType = artwork.FileType ?? "application/octet-stream",
                    ImagePath = artwork.ImagePath ?? string.Empty
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting artwork {ArtworkId} for download by user {UserId}", artworkId, userId);
                throw;
            }
        }

        public async Task<SellerStatsDto> GetSellerStatsAsync(int userId)
        {
            try
            {
                if (userId <= 0)
                    throw new ArgumentException("Invalid user ID", nameof(userId));

                // Check cache first
                var cacheKey = $"seller_stats_{userId}";
                if (_cache.TryGetValue(cacheKey, out SellerStatsDto cachedStats))
                    return cachedStats;

                // Get purchase records for this seller
                var purchaseRecords = await _artworkRepository.GetPurchaseRecordsForSellerAsync(userId);
                var artworks = await _artworkRepository.GetUserArtworksAsync(userId);

                var totalSales = purchaseRecords.Count();
                var totalRevenue = purchaseRecords.Sum(p => p.PurchasePrice);
                var listedArtworks = artworks.Count(a => a.IsListedForSale && a.SalePrice > 0);

                var stats = new SellerStatsDto
                {
                    TotalSales = totalSales,
                    TotalRevenue = totalRevenue,
                    ListedArtworks = listedArtworks
                };

                // Cache for 2 minutes
                _cache.Set(cacheKey, stats, TimeSpan.FromMinutes(2));

                return stats;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting seller stats for user {UserId}", userId);
                throw;
            }
        }

        private ArtworkDto MapToDto(Artwork artwork, string imageUrl)
        {
            if (artwork == null)
                throw new ArgumentNullException(nameof(artwork));

            return new ArtworkDto
            {
                Id = artwork.Id,
                FileName = artwork.FileName ?? "Unknown",
                FileType = artwork.FileType ?? "Unknown",
                FileSize = artwork.FileSize,
                SHA256Hash = artwork.SHA256Hash ?? string.Empty,
                PHash = artwork.PHash,
                ImageUrl = imageUrl,
                ImagePath = artwork.ImagePath,
                CreatedAt = artwork.CreatedAt,
                IsListedForSale = artwork.IsListedForSale,
                SalePrice = artwork.SalePrice,
                TransactionId = artwork.HederaRecords.FirstOrDefault()?.TransactionId ?? "NOT_REGISTERED",
                User = new UserDto
                {
                    Id = artwork.User?.Id ?? 0,
                    Username = artwork.User?.Username ?? "Unknown",
                    Email = artwork.User?.Email ?? "Unknown",
                    Role = artwork.User?.Role ?? "Unknown",
                    CreatedAt = artwork.User?.CreatedAt ?? DateTime.UtcNow
                }
            };
        }
    }
}