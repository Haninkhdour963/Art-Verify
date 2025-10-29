using Microsoft.AspNetCore.Http;
using System.Text.Json.Serialization;

namespace ArtVerify.Application.DTOs
{
    public class ArtworkDto
    {
        public int Id { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string FileType { get; set; } = string.Empty;
        public long FileSize { get; set; }

        [JsonPropertyName("sha256Hash")]
        public string SHA256Hash { get; set; } = string.Empty;

        public string? PHash { get; set; }
        public string? ImageUrl { get; set; }
        public string? ImagePath { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool IsListedForSale { get; set; }
        public decimal? SalePrice { get; set; }
        public string TransactionId { get; set; } = string.Empty;
        public UserDto User { get; set; } = null!;
    }

    public class CreateArtworkDto
    {
        public IFormFile File { get; set; } = null!;
        public bool UseBlockchain { get; set; } = true;
    }

    public class VerifyArtworkDto
    {
        public string? FileHash { get; set; }
        public string? TransactionId { get; set; }
        public IFormFile? File { get; set; }
    }

    public class VerificationResultDto
    {
        public bool IsVerified { get; set; }
        public string Message { get; set; } = string.Empty;
        public ArtworkDto? Artwork { get; set; }
    }

    public class ArtworkDownloadDto
    {
        public int Id { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string FileType { get; set; } = string.Empty;
        public string ImagePath { get; set; } = string.Empty;
    }

    public class PurchaseResultDto
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public ArtworkDto? Artwork { get; set; }
        public string TransactionId { get; set; } = string.Empty;
        public decimal AmountHbar { get; set; }
    }

    public class SellerStatsDto
    {
        public int TotalSales { get; set; }
        public decimal TotalRevenue { get; set; }
        public int ListedArtworks { get; set; }
    }
}