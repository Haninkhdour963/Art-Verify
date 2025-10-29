using ArtVerify.Application.Interfaces;
using Microsoft.AspNetCore.Http;
using System.Security.Cryptography;
using System.Text;

namespace ArtVerify.Infrastructure.Services
{
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
            await Task.CompletedTask;
            var baseString = $"{file.FileName}_{file.Length}_{file.ContentType}_{DateTime.UtcNow.Ticks}";
            using var sha1 = SHA1.Create();
            var bytes = Encoding.UTF8.GetBytes(baseString);
            var hash = sha1.ComputeHash(bytes);
            return "phash_" + BitConverter.ToString(hash).Replace("-", "").ToLowerInvariant();
        }
    }
}