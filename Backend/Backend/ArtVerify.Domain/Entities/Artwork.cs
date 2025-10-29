using System.ComponentModel.DataAnnotations;

namespace ArtVerify.Domain.Entities
{
    public class Artwork
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        [MaxLength(255)]
        public string FileName { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string FileType { get; set; } = string.Empty;

        public long FileSize { get; set; }

        [Required]
        [MaxLength(64)]
        public string SHA256Hash { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? PHash { get; set; }

        [MaxLength(500)]
        public string? ImagePath { get; set; }

        public string? MetadataJson { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public bool IsListedForSale { get; set; } = false;

        public decimal? SalePrice { get; set; }

        // Navigation properties
        public virtual User User { get; set; } = null!;
        public virtual ICollection<HederaRecord> HederaRecords { get; set; } = new List<HederaRecord>();
        public virtual ICollection<ArtworkPurchase> Purchases { get; set; } = new List<ArtworkPurchase>();
    }
}