using ArtVerify.Application.DTOs;
using ArtVerify.Application.Interfaces;
using ArtVerify.Domain.Entities;
using Microsoft.Extensions.Logging;

namespace ArtVerify.Application.Services
{
    public class AuthService : IAuthService
    {
        private readonly IAuthRepository _authRepository;
        private readonly IJwtTokenGenerator _jwtTokenGenerator;
        private readonly IPasswordHasher _passwordHasher;
        private readonly ILogger<AuthService> _logger;

        public AuthService(IAuthRepository authRepository, IJwtTokenGenerator jwtTokenGenerator,
            IPasswordHasher passwordHasher, ILogger<AuthService> logger)
        {
            _authRepository = authRepository;
            _jwtTokenGenerator = jwtTokenGenerator;
            _passwordHasher = passwordHasher;
            _logger = logger;
        }

        public async Task<AuthResponseDto> RegisterAsync(RegisterDto registerDto)
        {
            try
            {
                // Check if user already exists
                var existingUser = await _authRepository.GetUserByEmailAsync(registerDto.Email);
                if (existingUser != null)
                    throw new Exception("User with this email already exists");

                existingUser = await _authRepository.GetUserByUsernameAsync(registerDto.Username);
                if (existingUser != null)
                    throw new Exception("Username already taken");

                // Create new user
                var user = new User
                {
                    Username = registerDto.Username,
                    Email = registerDto.Email,
                    PasswordHash = _passwordHasher.HashPassword(registerDto.Password),
                    Role = registerDto.Role,
                    CreatedAt = DateTime.UtcNow
                };

                await _authRepository.AddUserAsync(user);
                await _authRepository.SaveChangesAsync();

                // Generate token
                var token = _jwtTokenGenerator.GenerateToken(user.Id, user.Username, user.Email, user.Role);

                return new AuthResponseDto
                {
                    Token = token,
                    User = new UserDto
                    {
                        Id = user.Id,
                        Username = user.Username,
                        Email = user.Email,
                        Role = user.Role,
                        CreatedAt = user.CreatedAt
                    },
                    ExpiresAt = DateTime.UtcNow.AddHours(24)
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error registering user {Email}", registerDto.Email);
                throw;
            }
        }

        public async Task<AuthResponseDto> LoginAsync(LoginDto loginDto)
        {
            try
            {
                var user = await _authRepository.GetUserByEmailAsync(loginDto.Email);
                if (user == null || !_passwordHasher.VerifyPassword(loginDto.Password, user.PasswordHash))
                    throw new Exception("Invalid email or password");

                // Generate token
                var token = _jwtTokenGenerator.GenerateToken(user.Id, user.Username, user.Email, user.Role);

                return new AuthResponseDto
                {
                    Token = token,
                    User = new UserDto
                    {
                        Id = user.Id,
                        Username = user.Username,
                        Email = user.Email,
                        Role = user.Role,
                        CreatedAt = user.CreatedAt
                    },
                    ExpiresAt = DateTime.UtcNow.AddHours(24)
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error logging in user {Email}", loginDto.Email);
                throw;
            }
        }

        public async Task<UserDto> GetCurrentUserAsync(int userId)
        {
            try
            {
                var user = await _authRepository.GetUserByIdAsync(userId);
                if (user == null)
                    throw new Exception("User not found");

                return new UserDto
                {
                    Id = user.Id,
                    Username = user.Username,
                    Email = user.Email,
                    Role = user.Role,
                    CreatedAt = user.CreatedAt
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting current user {UserId}", userId);
                throw;
            }
        }
    }
}