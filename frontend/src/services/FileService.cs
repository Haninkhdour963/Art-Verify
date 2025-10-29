using System.Security.Cryptography;
using System.Text;

namespace ArtVerify.Backend.Services
{
    public interface IFileService
    {
        Task<string> ComputeSHA256HashAsync(IFormFile file);
        Task<string> ComputePerceptualHashAsync(IFormFile file);
    }

    public class FileService : IFileService
    {
        public async Task<string> ComputeSHA256HashAsync(IFormFile file)
        {
            using var stream = file.OpenReadStream();
            using var sha256 = SHA256.Create();
            
            var hashBytes = await sha256.ComputeHashAsync(stream);
            return BitConverter.ToString(hashBytes).Replace("-", "").ToLowerInvariant();
        }

        public async Task<string> ComputePerceptualHashAsync(IFormFile file)
        {
            // Placeholder for perceptual hash implementation
            // In a real implementation, you would use a library like ImageHash
            // For now, return a mock value
            await Task.CompletedTask;
            return "phash_" + Guid.NewGuid().ToString("N");
        }
    }
}