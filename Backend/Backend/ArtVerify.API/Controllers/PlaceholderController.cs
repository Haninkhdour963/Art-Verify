using Microsoft.AspNetCore.Mvc;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;

namespace ArtVerify.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PlaceholderController : ControllerBase
    {
        [HttpGet("{width}/{height}/{bgColor}/{textColor}")]
        public IActionResult GeneratePlaceholder(int width, int height, string bgColor, string textColor, string text = "Artwork")
        {
            try
            {
                // For cross-platform compatibility, return a simple SVG instead of System.Drawing
                var svgContent = $@"
                    <svg width='{width}' height='{height}' xmlns='http://www.w3.org/2000/svg'>
                        <rect width='100%' height='100%' fill='#{bgColor.Replace("#", "")}'/>
                        <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' 
                              fill='#{textColor.Replace("#", "")}' font-family='Arial, sans-serif' 
                              font-size='14' font-weight='bold'>
                            {text}
                        </text>
                    </svg>";

                var stream = new MemoryStream();
                var writer = new StreamWriter(stream);
                writer.Write(svgContent);
                writer.Flush();
                stream.Position = 0;

                return File(stream, "image/svg+xml");
            }
            catch
            {
                // Return simple SVG as fallback
                var fallbackSvg = @"<svg width='1' height='1' xmlns='http://www.w3.org/2000/svg'><rect width='100%' height='100%' fill='#ccc'/></svg>";
                var stream = new MemoryStream(System.Text.Encoding.UTF8.GetBytes(fallbackSvg));
                return File(stream, "image/svg+xml");
            }
        }
    }
}