using ArtVerify.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace ArtVerify.Infrastructure.Persistence
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Artwork> Artworks { get; set; }
        public DbSet<HederaRecord> HederaRecords { get; set; }
        public DbSet<ArtworkPurchase> ArtworkPurchases { get; set; }
        public DbSet<Dispute> Disputes { get; set; }
        public DbSet<Decision> Decisions { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User configuration with indexes
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasIndex(u => u.Email).IsUnique();
                entity.HasIndex(u => u.Username).IsUnique();
                entity.Property(u => u.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(u => u.Role).HasDefaultValue("Buyer");

                // Query filter for soft delete if implemented
                // entity.HasQueryFilter(u => !u.IsDeleted);
            });

            // Artwork configuration with performance indexes
            modelBuilder.Entity<Artwork>(entity =>
            {
                entity.HasIndex(a => a.SHA256Hash).IsUnique();
                entity.HasIndex(a => a.PHash);
                entity.HasIndex(a => a.UserId);
                entity.HasIndex(a => a.IsListedForSale);
                entity.HasIndex(a => a.CreatedAt);
                entity.Property(a => a.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

                entity.HasOne(a => a.User)
                      .WithMany(u => u.Artworks)
                      .HasForeignKey(a => a.UserId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // HederaRecord configuration
            modelBuilder.Entity<HederaRecord>(entity =>
            {
                entity.HasIndex(h => h.TransactionId).IsUnique();
                entity.HasIndex(h => h.ArtworkId);
                entity.Property(h => h.RecordedAt).HasDefaultValueSql("GETUTCDATE()");

                entity.HasOne(h => h.Artwork)
                      .WithMany(a => a.HederaRecords)
                      .HasForeignKey(h => h.ArtworkId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // ArtworkPurchase configuration with composite index
            modelBuilder.Entity<ArtworkPurchase>(entity =>
            {
                entity.HasIndex(p => new { p.BuyerId, p.ArtworkId }).IsUnique();
                entity.HasIndex(p => p.BuyerId);
                entity.HasIndex(p => p.ArtworkId);
                entity.HasIndex(p => p.PurchaseDate);
                entity.Property(p => p.PurchaseDate).HasDefaultValueSql("GETUTCDATE()");

                entity.HasOne(p => p.Artwork)
                      .WithMany(a => a.Purchases)
                      .HasForeignKey(p => p.ArtworkId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(p => p.Buyer)
                      .WithMany(u => u.Purchases)
                      .HasForeignKey(p => p.BuyerId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // Dispute configuration
            modelBuilder.Entity<Dispute>(entity =>
            {
                entity.HasIndex(d => d.ArtworkId);
                entity.HasIndex(d => d.ClaimantUserId);
                entity.HasIndex(d => d.DefendantUserId);
                entity.HasIndex(d => d.Status);

                entity.HasOne(d => d.Artwork)
                      .WithMany()
                      .HasForeignKey(d => d.ArtworkId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(d => d.ClaimantUser)
                      .WithMany(u => u.DisputesAsClaimant)
                      .HasForeignKey(d => d.ClaimantUserId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(d => d.DefendantUser)
                      .WithMany(u => u.DisputesAsDefendant)
                      .HasForeignKey(d => d.DefendantUserId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // Decision configuration
            modelBuilder.Entity<Decision>(entity =>
            {
                entity.HasIndex(d => d.DisputeId).IsUnique();
                entity.HasIndex(d => d.DecidedByUserId);

                entity.HasOne(d => d.Dispute)
                      .WithOne(d => d.Decision)
                      .HasForeignKey<Decision>(d => d.DisputeId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(d => d.DecidedByUser)
                      .WithMany()
                      .HasForeignKey(d => d.DecidedByUserId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // AuditLog configuration
            modelBuilder.Entity<AuditLog>(entity =>
            {
                entity.HasIndex(a => a.EventType);
                entity.HasIndex(a => a.UserId);
                entity.HasIndex(a => a.Timestamp);
                entity.HasIndex(a => new { a.EventType, a.Timestamp });

                entity.HasOne(a => a.User)
                      .WithMany()
                      .HasForeignKey(a => a.UserId)
                      .OnDelete(DeleteBehavior.SetNull);
            });
        }

        public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            // Auto-set audit dates if implemented
            var entries = ChangeTracker.Entries()
                .Where(e => e.Entity is BaseEntity && (
                        e.State == EntityState.Added
                        || e.State == EntityState.Modified));

            foreach (var entityEntry in entries)
            {
                ((BaseEntity)entityEntry.Entity).UpdatedAt = DateTime.UtcNow;

                if (entityEntry.State == EntityState.Added)
                {
                    ((BaseEntity)entityEntry.Entity).CreatedAt = DateTime.UtcNow;
                }
            }

            try
            {
                return await base.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateException ex)
            {
                // Log and handle DB exceptions
                throw new Exception("Database update error occurred", ex);
            }
        }
    }

    // Base entity class for common properties
    public abstract class BaseEntity
    {
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}