using ArtVerify.Application.Interfaces;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace ArtVerify.Infrastructure.Services
{
    public class ImageService : IImageService
    {
        private readonly IWebHostEnvironment _environment;
        private readonly IConfiguration _configuration;
        private readonly ILogger<ImageService> _logger;

        public ImageService(IWebHostEnvironment environment, IConfiguration configuration, ILogger<ImageService> logger)
        {
            _environment = environment;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<string> SaveImageAsync(IFormFile imageFile, int artworkId, string fileName)
        {
            try
            {
                // Ensure wwwroot directory exists
                var wwwrootPath = Path.Combine(_environment.WebRootPath ?? _environment.ContentRootPath, "wwwroot");
                if (!Directory.Exists(wwwrootPath))
                {
                    Directory.CreateDirectory(wwwrootPath);
                }

                // Create directory structure
                var imagesPath = Path.Combine(wwwrootPath, "images");
                var artworksPath = Path.Combine(imagesPath, "artworks");
                var artworkSpecificPath = Path.Combine(artworksPath, artworkId.ToString());

                Directory.CreateDirectory(artworkSpecificPath);

                // Generate unique file name
                var fileExtension = Path.GetExtension(fileName).ToLowerInvariant();
                var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";
                var filePath = Path.Combine(artworkSpecificPath, uniqueFileName);

                // Optimized file save with buffer
                await using var stream = new FileStream(filePath, FileMode.Create, FileAccess.Write, FileShare.None, 4096, FileOptions.Asynchronous);
                await imageFile.CopyToAsync(stream);

                // Return relative path
                var relativePath = Path.Combine("images", "artworks", artworkId.ToString(), uniqueFileName).Replace("\\", "/");

                _logger.LogInformation("Image saved successfully: {RelativePath}", relativePath);
                return relativePath;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving image for artwork {ArtworkId}", artworkId);
                throw new Exception($"Failed to save image: {ex.Message}");
            }
        }

        public string GetImageUrl(string imagePath)
        {
            if (string.IsNullOrEmpty(imagePath))
            {
                _logger.LogWarning("No image path provided, using placeholder");
                return GetPlaceholderUrl();
            }

            try
            {
                var baseUrl = _configuration["BaseUrl"] ?? "http://localhost:5000";

                // Parse the image path to extract artworkId and fileName
                var pathParts = imagePath.Split('/');
                if (pathParts.Length >= 4 && pathParts[0] == "images" && pathParts[1] == "artworks")
                {
                    var artworkId = pathParts[2];
                    var fileName = pathParts[3];
                    return $"{baseUrl}/api/artworks/image/{artworkId}/{fileName}";
                }

                // Fallback
                if (!imagePath.StartsWith("/"))
                {
                    imagePath = "/" + imagePath;
                }
                return $"{baseUrl}{imagePath}";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating image URL for path {ImagePath}", imagePath);
                return GetPlaceholderUrl();
            }
        }

        private string GetPlaceholderUrl()
        {
            var baseUrl = _configuration["BaseUrl"] ?? "http://localhost:5000";
            return $"{baseUrl}/images/placeholder.jpg";
        }

        public string GetImagePhysicalPath(string imagePath)
        {
            if (string.IsNullOrEmpty(imagePath))
            {
                _logger.LogWarning("No image path provided for physical path");
                return null;
            }

            try
            {
                // Remove leading slash if present
                if (imagePath.StartsWith("/"))
                {
                    imagePath = imagePath.Substring(1);
                }

                var physicalPath = Path.Combine(_environment.WebRootPath ?? _environment.ContentRootPath, "wwwroot", imagePath);

                if (File.Exists(physicalPath))
                {
                    return physicalPath;
                }

                // Try alternative path
                var altPath = Path.Combine(_environment.ContentRootPath, "wwwroot", imagePath);
                return File.Exists(altPath) ? altPath : null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting physical path for {ImagePath}", imagePath);
                return null;
            }
        }

        public Task<bool> DeleteImageAsync(string imagePath)
        {
            try
            {
                if (string.IsNullOrEmpty(imagePath))
                    return Task.FromResult(true);

                var physicalPath = GetImagePhysicalPath(imagePath);
                if (physicalPath != null && File.Exists(physicalPath))
                {
                    File.Delete(physicalPath);
                    _logger.LogInformation("Deleted image: {PhysicalPath}", physicalPath);
                }

                return Task.FromResult(true);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting image at path {ImagePath}", imagePath);
                return Task.FromResult(false);
            }
        }

        public async Task<byte[]> GetImageBytesAsync(string imagePath)
        {
            try
            {
                var physicalPath = GetImagePhysicalPath(imagePath);
                if (physicalPath != null && File.Exists(physicalPath))
                {
                    var bytes = await File.ReadAllBytesAsync(physicalPath);
                    _logger.LogDebug("Read {ByteCount} bytes from image {ImagePath}", bytes.Length, imagePath);
                    return bytes;
                }

                _logger.LogWarning("Could not read image bytes - file not found: {ImagePath}", imagePath);
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reading image bytes from {ImagePath}", imagePath);
                return null;
            }
        }
    }
}