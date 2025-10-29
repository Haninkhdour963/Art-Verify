using ArtVerify.Domain.Entities;
using Microsoft.AspNetCore.Http;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ArtVerify.Application.Interfaces
{
    public interface IArtworkRepository
    {
        Task<Artwork?> GetBySHA256HashAsync(string sha256Hash);
        Task<Artwork?> GetByIdAsync(int artworkId);
        Task<IEnumerable<Artwork>> GetUserArtworksAsync(int userId);
        Task<IEnumerable<Artwork>> GetMarketplaceArtworksAsync();
        Task<IEnumerable<Artwork>> GetPurchasedArtworksAsync(int userId);
        Task<IEnumerable<ArtworkPurchase>> GetPurchaseRecordsForSellerAsync(int sellerId);
        Task AddArtworkAsync(Artwork artwork);
        Task AddHederaRecordAsync(HederaRecord hederaRecord);
        Task AddPurchaseRecordAsync(ArtworkPurchase purchase);
        Task UpdateArtworkAsync(Artwork artwork);
        Task DeleteArtworkAsync(int artworkId);
        Task<Artwork?> GetByTransactionIdAsync(string transactionId);
        Task<bool> HasUserPurchasedArtworkAsync(int userId, int artworkId);
        Task SaveChangesAsync();
    }
}