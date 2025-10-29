using ArtVerify.Application.Interfaces;
using ArtVerify.Domain.Entities;
using ArtVerify.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace ArtVerify.Infrastructure.Repositories
{
    public class ArtworkRepository : IArtworkRepository
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ArtworkRepository> _logger;

        public ArtworkRepository(ApplicationDbContext context, ILogger<ArtworkRepository> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task AddArtworkAsync(Artwork artwork)
        {
            try
            {
                await _context.Artworks.AddAsync(artwork);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding artwork");
                throw;
            }
        }

        public async Task AddHederaRecordAsync(HederaRecord hederaRecord)
        {
            try
            {
                await _context.HederaRecords.AddAsync(hederaRecord);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding hedera record");
                throw;
            }
        }

        public async Task AddPurchaseRecordAsync(ArtworkPurchase purchase)
        {
            try
            {
                await _context.ArtworkPurchases.AddAsync(purchase);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding purchase record");
                throw;
            }
        }

        public async Task<Artwork?> GetBySHA256HashAsync(string sha256Hash)
        {
            try
            {
                return await _context.Artworks
                    .AsNoTracking()
                    .Include(a => a.User)
                    .Include(a => a.HederaRecords)
                    .FirstOrDefaultAsync(a => a.SHA256Hash == sha256Hash);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting artwork by hash {Hash}", sha256Hash);
                throw;
            }
        }

        public async Task<Artwork?> GetByIdAsync(int artworkId)
        {
            try
            {
                return await _context.Artworks
                    .Include(a => a.User)
                    .Include(a => a.HederaRecords)
                    .Include(a => a.Purchases)
                    .FirstOrDefaultAsync(a => a.Id == artworkId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting artwork by ID {ArtworkId}", artworkId);
                throw;
            }
        }

        public async Task<IEnumerable<Artwork>> GetUserArtworksAsync(int userId)
        {
            try
            {
                return await _context.Artworks
                    .AsNoTracking()
                    .Where(a => a.UserId == userId)
                    .Include(a => a.User)
                    .Include(a => a.HederaRecords)
                    .Include(a => a.Purchases)
                    .OrderByDescending(a => a.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user artworks for user {UserId}", userId);
                throw;
            }
        }

        public async Task<IEnumerable<Artwork>> GetMarketplaceArtworksAsync()
        {
            try
            {
                return await _context.Artworks
                    .AsNoTracking()
                    .Where(a => a.IsListedForSale && a.SalePrice > 0)
                    .Include(a => a.User)
                    .Include(a => a.HederaRecords)
                    .OrderByDescending(a => a.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting marketplace artworks");
                throw;
            }
        }

        public async Task<IEnumerable<Artwork>> GetPurchasedArtworksAsync(int userId)
        {
            try
            {
                return await _context.ArtworkPurchases
                    .AsNoTracking()
                    .Where(p => p.BuyerId == userId)
                    .Include(p => p.Artwork)
                    .ThenInclude(a => a.User)
                    .Include(p => p.Artwork)
                    .ThenInclude(a => a.HederaRecords)
                    .Select(p => p.Artwork)
                    .OrderByDescending(a => a.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting purchased artworks for user {UserId}", userId);
                throw;
            }
        }

        public async Task<IEnumerable<ArtworkPurchase>> GetPurchaseRecordsForSellerAsync(int sellerId)
        {
            try
            {
                return await _context.ArtworkPurchases
                    .AsNoTracking()
                    .Include(p => p.Artwork)
                    .Where(p => p.Artwork.UserId == sellerId)
                    .OrderByDescending(p => p.PurchaseDate)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting purchase records for seller {SellerId}", sellerId);
                throw;
            }
        }

        public async Task<Artwork?> GetByTransactionIdAsync(string transactionId)
        {
            try
            {
                var hederaRecord = await _context.HederaRecords
                    .AsNoTracking()
                    .Include(hr => hr.Artwork)
                    .ThenInclude(a => a.User)
                    .FirstOrDefaultAsync(hr => hr.TransactionId == transactionId);

                return hederaRecord?.Artwork;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting artwork by transaction ID {TransactionId}", transactionId);
                throw;
            }
        }

        public async Task<bool> HasUserPurchasedArtworkAsync(int userId, int artworkId)
        {
            try
            {
                return await _context.ArtworkPurchases
                    .AsNoTracking()
                    .AnyAsync(p => p.BuyerId == userId && p.ArtworkId == artworkId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking if user {UserId} purchased artwork {ArtworkId}", userId, artworkId);
                throw;
            }
        }

        public Task UpdateArtworkAsync(Artwork artwork)
        {
            try
            {
                _context.Artworks.Update(artwork);
                return Task.CompletedTask;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating artwork {ArtworkId}", artwork.Id);
                throw;
            }
        }

        public async Task DeleteArtworkAsync(int artworkId)
        {
            try
            {
                var artwork = await _context.Artworks.FindAsync(artworkId);
                if (artwork != null)
                {
                    _context.Artworks.Remove(artwork);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting artwork {ArtworkId}", artworkId);
                throw;
            }
        }

        public async Task SaveChangesAsync()
        {
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving changes");
                throw;
            }
        }
    }
}