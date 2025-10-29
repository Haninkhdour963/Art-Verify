using System.ComponentModel.DataAnnotations;

namespace ArtVerify.Domain.Entities
{
    public class AuditLog
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string EventType { get; set; } = string.Empty; // UPLOAD, VERIFY, LOGIN, etc.

        public int? UserId { get; set; }

        public int? TargetId { get; set; } // ArtworkId, UserId, etc.

        public string? DetailsJson { get; set; }

        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        [MaxLength(50)]
        public string? IpAddress { get; set; }

        // Navigation properties
        public virtual User? User { get; set; }
    }
}