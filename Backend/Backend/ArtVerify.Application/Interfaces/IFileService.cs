using Microsoft.AspNetCore.Http;

namespace ArtVerify.Application.Interfaces
{
    public interface IFileService
    {
        Task<string> ComputeSHA256HashAsync(IFormFile file);
        Task<string> ComputePerceptualHashAsync(IFormFile file);
    }
}