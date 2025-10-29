using ArtVerify.Application.Interfaces;
using ArtVerify.Application.Services;
using ArtVerify.Infrastructure.Persistence;
using ArtVerify.Infrastructure.Repositories;
using ArtVerify.Infrastructure.Security;
using ArtVerify.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace ArtVerify.API.Extensions
{
    public static class ServiceExtensions
    {
        public static IServiceCollection AddApplicationServices(this IServiceCollection services, IConfiguration configuration)
        {
            // Register services with scoped lifetime
            services.AddScoped<IAuthService, AuthService>();
            services.AddScoped<IArtworkService, ArtworkService>();
            services.AddScoped<IHederaService, HederaService>();
            services.AddScoped<IImageService, ImageService>();
            services.AddScoped<IFileService, FileService>();

            // Register repositories
            services.AddScoped<IAuthRepository, AuthRepository>();
            services.AddScoped<IArtworkRepository, ArtworkRepository>();

            // Add memory cache
            services.AddMemoryCache();

            return services;
        }

        public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
        {
            // Security services
            services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
            services.AddScoped<IPasswordHasher, PasswordHasher>();

            // Database context with connection pooling
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseSqlServer(
                    configuration.GetConnectionString("DefaultConnection"),
                    sqlOptions =>
                    {
                        sqlOptions.EnableRetryOnFailure(
                            maxRetryCount: 5,
                            maxRetryDelay: TimeSpan.FromSeconds(30),
                            errorNumbersToAdd: null);
                    }));

            // JWT Authentication
            var jwtSettings = configuration.GetSection("JwtSettings");
            var secret = jwtSettings["Secret"] ?? throw new Exception("JWT Secret not configured");

            services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options =>
                {
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer = true,
                        ValidateAudience = true,
                        ValidateLifetime = true,
                        ValidateIssuerSigningKey = true,
                        ValidIssuer = jwtSettings["Issuer"],
                        ValidAudience = jwtSettings["Audience"],
                        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret)),
                        ClockSkew = TimeSpan.Zero // Remove delay for token expiration
                    };

                    options.Events = new JwtBearerEvents
                    {
                        OnAuthenticationFailed = context =>
                        {
                            if (context.Exception.GetType() == typeof(SecurityTokenExpiredException))
                            {
                                context.Response.Headers.Add("Token-Expired", "true");
                            }
                            return Task.CompletedTask;
                        }
                    };
                });

            services.AddAuthorization(options =>
            {
                options.AddPolicy("SellerOnly", policy =>
                    policy.RequireRole("Seller"));
                options.AddPolicy("BuyerOnly", policy =>
                    policy.RequireRole("Buyer"));
            });

            return services;
        }
    }
}