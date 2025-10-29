using Microsoft.AspNetCore.Http;

namespace ArtVerify.Application.Interfaces
{
    public interface IImageService
    {
        Task<string> SaveImageAsync(IFormFile imageFile, int artworkId, string fileName);
        string GetImageUrl(string imagePath);
        Task<bool> DeleteImageAsync(string imagePath);
        string GetImagePhysicalPath(string imagePath);
        Task<byte[]> GetImageBytesAsync(string imagePath);
    }
}