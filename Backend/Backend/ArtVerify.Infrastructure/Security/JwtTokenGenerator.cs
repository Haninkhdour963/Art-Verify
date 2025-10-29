using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using ArtVerify.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;

namespace ArtVerify.Infrastructure.Security
{
    public class JwtTokenGenerator : IJwtTokenGenerator
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<JwtTokenGenerator> _logger;

        public JwtTokenGenerator(IConfiguration configuration, ILogger<JwtTokenGenerator> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public string GenerateToken(int userId, string username, string email, string role)
        {
            try
            {
                var jwtSettings = _configuration.GetSection("JwtSettings");
                var secret = jwtSettings["Secret"] ?? throw new Exception("JWT Secret not configured");
                var issuer = jwtSettings["Issuer"] ?? "ArtVerify";
                var audience = jwtSettings["Audience"] ?? "ArtVerifyUsers";
                var expiryMinutes = int.Parse(jwtSettings["ExpiryMinutes"] ?? "60");

                var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
                var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

                var claims = new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                    new Claim(ClaimTypes.Name, username),
                    new Claim(ClaimTypes.Email, email),
                    new Claim(ClaimTypes.Role, role),
                    new Claim("userId", userId.ToString())
                };

                var token = new JwtSecurityToken(
                    issuer: issuer,
                    audience: audience,
                    claims: claims,
                    expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
                    signingCredentials: credentials
                );

                _logger.LogDebug("JWT token generated for user {UserId}", userId);
                return new JwtSecurityTokenHandler().WriteToken(token);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating JWT token for user {UserId}", userId);
                throw;
            }
        }
    }
}