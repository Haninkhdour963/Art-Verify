using System.ComponentModel.DataAnnotations;

namespace ArtVerify.Domain.Entities
{
    public class Decision
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int DisputeId { get; set; }

        [Required]
        public int DecidedByUserId { get; set; }

        [Required]
        public string DecisionText { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? DecisionTransactionId { get; set; }

        public DateTime DecisionTimestamp { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual Dispute Dispute { get; set; } = null!;
        public virtual User DecidedByUser { get; set; } = null!;
    }
}