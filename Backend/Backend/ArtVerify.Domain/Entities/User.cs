using System.ComponentModel.DataAnnotations;

namespace ArtVerify.Domain.Entities
{
    public class User
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Username { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [MaxLength(200)]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? PublicKey { get; set; }

        [Required]
        [MaxLength(20)]
        public string Role { get; set; } = "Buyer"; // "Seller" or "Buyer"

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public bool MfaEnabled { get; set; } = false;

        public string? EncryptedRecoveryInfo { get; set; }

        // Navigation properties
        public virtual ICollection<Artwork> Artworks { get; set; } = new List<Artwork>();
        public virtual ICollection<ArtworkPurchase> Purchases { get; set; } = new List<ArtworkPurchase>();
        public virtual ICollection<Dispute> DisputesAsClaimant { get; set; } = new List<Dispute>();
        public virtual ICollection<Dispute> DisputesAsDefendant { get; set; } = new List<Dispute>();
    }
}