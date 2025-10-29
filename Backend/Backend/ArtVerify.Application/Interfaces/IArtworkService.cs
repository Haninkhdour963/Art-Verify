using ArtVerify.Application.DTOs;
using ArtVerify.Domain.Entities;
using Microsoft.AspNetCore.Http;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ArtVerify.Application.Interfaces
{
    public interface IArtworkService
    {
        Task<ArtworkDto> UploadArtworkAsync(CreateArtworkDto createArtworkDto, int userId);
        Task<VerificationResultDto> VerifyArtworkAsync(VerifyArtworkDto verifyDto);
        Task<IEnumerable<ArtworkDto>> GetUserArtworksAsync(int userId);
        Task<IEnumerable<ArtworkDto>> GetMarketplaceArtworksAsync();
        Task<IEnumerable<ArtworkDto>> GetPurchasedArtworksAsync(int userId);
        Task<ArtworkDto> ListForSaleAsync(int artworkId, decimal price, int userId);
        Task<PurchaseResultDto> PurchaseArtworkAsync(int artworkId, int userId);
        Task<ArtworkDownloadDto> GetArtworkForDownloadAsync(int artworkId, int userId);
        Task<SellerStatsDto> GetSellerStatsAsync(int userId);
    }
}