using System.ComponentModel.DataAnnotations;

namespace ArtVerify.Domain.Entities
{
    public class Dispute
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ArtworkId { get; set; }

        [Required]
        public int ClaimantUserId { get; set; }

        [Required]
        public int DefendantUserId { get; set; }

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "PENDING"; // PENDING, RESOLVED, CANCELLED

        public string? EvidenceJson { get; set; }

        public int? DecisionId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ResolvedAt { get; set; }

        // Navigation properties
        public virtual Artwork Artwork { get; set; } = null!;
        public virtual User ClaimantUser { get; set; } = null!;
        public virtual User DefendantUser { get; set; } = null!;
        public virtual Decision? Decision { get; set; }
    }
}