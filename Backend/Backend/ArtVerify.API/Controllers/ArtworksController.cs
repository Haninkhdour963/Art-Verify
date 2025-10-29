using ArtVerify.Application.DTOs;
using ArtVerify.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;

namespace ArtVerify.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ArtworksController : ControllerBase
    {
        private readonly IArtworkService _artworkService;
        private readonly IImageService _imageService;
        private readonly IMemoryCache _cache;
        private readonly ILogger<ArtworksController> _logger;

        public ArtworksController(IArtworkService artworkService, IImageService imageService,
            IMemoryCache cache, ILogger<ArtworksController> logger)
        {
            _artworkService = artworkService ?? throw new ArgumentNullException(nameof(artworkService));
            _imageService = imageService ?? throw new ArgumentNullException(nameof(imageService));
            _cache = cache ?? throw new ArgumentNullException(nameof(cache));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        [HttpPost("upload")]
        public async Task<ActionResult<ArtworkDto>> UploadArtwork([FromForm] CreateArtworkDto createArtworkDto)
        {
            try
            {
                _logger.LogInformation("Starting artwork upload process");

                if (createArtworkDto == null)
                {
                    _logger.LogWarning("Upload request with null CreateArtworkDto");
                    return BadRequest(new { message = "Upload data cannot be null" });
                }

                if (createArtworkDto.File == null)
                {
                    _logger.LogWarning("Upload request with null file");
                    return BadRequest(new { message = "File cannot be null" });
                }

                var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
                if (userId == 0)
                {
                    _logger.LogWarning("Upload request with unauthenticated user");
                    return Unauthorized(new { message = "User not authenticated" });
                }

                _logger.LogInformation("Uploading artwork for user {UserId}, file: {FileName}", userId, createArtworkDto.File.FileName);

                var artwork = await _artworkService.UploadArtworkAsync(createArtworkDto, userId);

                // Clear marketplace cache
                _cache.Remove("marketplace_artworks");
                _cache.Remove($"user_artworks_{userId}");

                _logger.LogInformation("Artwork uploaded successfully with ID: {ArtworkId}", artwork.Id);
                return Ok(artwork);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading artwork");
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("verify")]
        [AllowAnonymous]
        public async Task<ActionResult<VerificationResultDto>> VerifyArtwork([FromForm] VerifyArtworkDto verifyDto)
        {
            try
            {
                if (verifyDto == null)
                    return BadRequest(new { message = "Verification data cannot be null" });

                var cacheKey = $"verify_{verifyDto.FileHash}_{verifyDto.TransactionId}";
                if (_cache.TryGetValue(cacheKey, out VerificationResultDto cachedResult))
                    return Ok(cachedResult);

                var result = await _artworkService.VerifyArtworkAsync(verifyDto);

                // Cache verification result for 5 minutes
                _cache.Set(cacheKey, result, TimeSpan.FromMinutes(5));

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verifying artwork");
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("user")]
        public async Task<ActionResult<IEnumerable<ArtworkDto>>> GetUserArtworks()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
                if (userId == 0)
                    return Unauthorized(new { message = "User not authenticated" });

                var cacheKey = $"user_artworks_{userId}";
                if (_cache.TryGetValue(cacheKey, out IEnumerable<ArtworkDto> cachedArtworks))
                    return Ok(cachedArtworks);

                var artworks = await _artworkService.GetUserArtworksAsync(userId);

                // Cache for 2 minutes
                _cache.Set(cacheKey, artworks, TimeSpan.FromMinutes(2));

                return Ok(artworks);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user artworks");
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("purchased")]
        public async Task<ActionResult<IEnumerable<ArtworkDto>>> GetPurchasedArtworks()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
                if (userId == 0)
                    return Unauthorized(new { message = "User not authenticated" });

                var cacheKey = $"purchased_artworks_{userId}";
                if (_cache.TryGetValue(cacheKey, out IEnumerable<ArtworkDto> cachedArtworks))
                    return Ok(cachedArtworks);

                var artworks = await _artworkService.GetPurchasedArtworksAsync(userId);

                // Cache for 2 minutes
                _cache.Set(cacheKey, artworks, TimeSpan.FromMinutes(2));

                return Ok(artworks);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting purchased artworks");
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("marketplace")]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<ArtworkDto>>> GetMarketplaceArtworks()
        {
            try
            {
                const string cacheKey = "marketplace_artworks";
                if (_cache.TryGetValue(cacheKey, out IEnumerable<ArtworkDto> cachedArtworks))
                    return Ok(cachedArtworks);

                var artworks = await _artworkService.GetMarketplaceArtworksAsync();

                // Cache for 3 minutes
                _cache.Set(cacheKey, artworks, TimeSpan.FromMinutes(3));

                return Ok(artworks);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting marketplace artworks");
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("{id}/list")]
        [Authorize(Roles = "Seller")]
        public async Task<ActionResult<ArtworkDto>> ListForSale(int id, [FromBody] ListForSaleDto listDto)
        {
            try
            {
                if (listDto == null)
                    return BadRequest(new { message = "Listing data cannot be null" });

                var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
                if (userId == 0)
                    return Unauthorized(new { message = "User not authenticated" });

                var artwork = await _artworkService.ListForSaleAsync(id, listDto.Price, userId);

                // Clear relevant caches
                _cache.Remove("marketplace_artworks");
                _cache.Remove($"user_artworks_{userId}");

                return Ok(artwork);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error listing artwork for sale");
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("{id}/purchase")]
        [Authorize(Roles = "Buyer")]
        public async Task<ActionResult<PurchaseResultDto>> PurchaseArtwork(int id)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
                if (userId == 0)
                    return Unauthorized(new { message = "User not authenticated" });

                var result = await _artworkService.PurchaseArtworkAsync(id, userId);

                // Clear relevant caches
                _cache.Remove("marketplace_artworks");
                _cache.Remove($"purchased_artworks_{userId}");

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error purchasing artwork");
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("{id}/download")]
        public async Task<IActionResult> DownloadArtwork(int id)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
                if (userId == 0)
                    return Unauthorized(new { message = "User not authenticated" });

                var artworkDownload = await _artworkService.GetArtworkForDownloadAsync(id, userId);
                if (artworkDownload == null)
                    return NotFound(new { message = "Artwork not found" });

                if (string.IsNullOrEmpty(artworkDownload.ImagePath))
                    return NotFound(new { message = "Image not found" });

                var cacheKey = $"image_{artworkDownload.ImagePath}";
                if (!_cache.TryGetValue(cacheKey, out byte[] imageBytes))
                {
                    imageBytes = await _imageService.GetImageBytesAsync(artworkDownload.ImagePath);
                    if (imageBytes == null)
                        return NotFound(new { message = "Image file not found" });

                    // Cache image for 10 minutes
                    _cache.Set(cacheKey, imageBytes, TimeSpan.FromMinutes(10));
                }

                var contentType = GetContentType(artworkDownload.ImagePath);
                var fileName = GetDownloadFileName(artworkDownload.FileName, artworkDownload.ImagePath);

                return File(imageBytes, contentType, fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error downloading artwork");
                return BadRequest(new { message = "Failed to download artwork" });
            }
        }

        [HttpGet("image/{artworkId}/{fileName}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetArtworkImage(int artworkId, string fileName)
        {
            try
            {
                var imagePath = $"images/artworks/{artworkId}/{fileName}";
                var cacheKey = $"image_{imagePath}";

                if (!_cache.TryGetValue(cacheKey, out byte[] imageBytes))
                {
                    imageBytes = await _imageService.GetImageBytesAsync(imagePath);
                    if (imageBytes == null)
                        return NotFound(new { message = "Image not found" });

                    // Cache image for 15 minutes
                    _cache.Set(cacheKey, imageBytes, TimeSpan.FromMinutes(15));
                }

                var contentType = GetContentType(fileName);
                return File(imageBytes, contentType);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error serving image");
                return NotFound(new { message = "Image not found" });
            }
        }

        [HttpGet("image/{artworkId}/{fileName}/exists")]
        [AllowAnonymous]
        public IActionResult CheckImageExists(int artworkId, string fileName)
        {
            try
            {
                var imagePath = $"images/artworks/{artworkId}/{fileName}";
                var cacheKey = $"image_exists_{imagePath}";

                if (_cache.TryGetValue(cacheKey, out bool exists))
                    return Ok(new { exists });

                var physicalPath = _imageService.GetImagePhysicalPath(imagePath);
                exists = physicalPath != null && System.IO.File.Exists(physicalPath);

                // Cache existence check for 5 minutes
                _cache.Set(cacheKey, exists, TimeSpan.FromMinutes(5));

                return Ok(new { exists });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking image existence");
                return Ok(new { exists = false });
            }
        }

        [HttpGet("seller-stats")]
        [Authorize(Roles = "Seller")]
        public async Task<ActionResult<SellerStatsDto>> GetSellerStats()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
                if (userId == 0)
                    return Unauthorized(new { message = "User not authenticated" });

                var stats = await _artworkService.GetSellerStatsAsync(userId);
                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting seller stats");
                return BadRequest(new { message = ex.Message });
            }
        }

        private string GetContentType(string imagePath)
        {
            if (string.IsNullOrEmpty(imagePath))
                return "application/octet-stream";

            var extension = Path.GetExtension(imagePath).ToLowerInvariant();
            return extension switch
            {
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                ".gif" => "image/gif",
                ".webp" => "image/webp",
                ".jfif" => "image/jpeg",
                _ => "application/octet-stream"
            };
        }

        private string GetDownloadFileName(string originalFileName, string imagePath)
        {
            try
            {
                var fileNameWithoutExtension = Path.GetFileNameWithoutExtension(originalFileName) ?? "artwork";
                var correctExtension = Path.GetExtension(imagePath) ?? ".jpg";
                return $"{fileNameWithoutExtension}{correctExtension}";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating download file name");
                return $"artwork{Path.GetExtension(imagePath) ?? ".jpg"}";
            }
        }
    }

    public class ListForSaleDto
    {
        public decimal Price { get; set; }
    }
}