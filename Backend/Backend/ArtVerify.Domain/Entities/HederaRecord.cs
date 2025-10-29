using System.ComponentModel.DataAnnotations;

namespace ArtVerify.Domain.Entities
{
    public class HederaRecord
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ArtworkId { get; set; }

        [Required]
        [MaxLength(100)]
        public string TransactionId { get; set; } = string.Empty;

        public DateTime ConsensusTimestamp { get; set; }

        [MaxLength(1024)]
        public string? Memo { get; set; }

        [MaxLength(500)]
        public string? Signature { get; set; }

        [MaxLength(50)]
        public string NodeStatus { get; set; } = "SUCCESS";

        public DateTime RecordedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual Artwork Artwork { get; set; } = null!;
    }
}