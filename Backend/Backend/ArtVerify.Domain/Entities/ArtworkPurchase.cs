using System.ComponentModel.DataAnnotations;

namespace ArtVerify.Domain.Entities
{
    public class ArtworkPurchase
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ArtworkId { get; set; }

        [Required]
        public int BuyerId { get; set; }

        [Required]
        public decimal PurchasePrice { get; set; }

        public DateTime PurchaseDate { get; set; } = DateTime.UtcNow;

        [MaxLength(100)]
        public string? TransactionId { get; set; }

        // Navigation properties
        public virtual Artwork Artwork { get; set; } = null!;
        public virtual User Buyer { get; set; } = null!;
    }
}