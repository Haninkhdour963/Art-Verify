using ArtVerify.Application.DTOs;
using ArtVerify.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text.RegularExpressions;

namespace ArtVerify.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(IAuthService authService, ILogger<AuthController> logger)
        {
            _authService = authService;
            _logger = logger;
        }

        [HttpPost("register")]
        public async Task<ActionResult<AuthResponseDto>> Register([FromBody] RegisterDto registerDto)
        {
            try
            {
                // Enhanced validation
                var validationResult = ValidateRegistration(registerDto);
                if (!validationResult.IsValid)
                {
                    return BadRequest(new { message = validationResult.ErrorMessage });
                }

                var result = await _authService.RegisterAsync(registerDto);

                _logger.LogInformation("User registered successfully: {Email}", registerDto.Email);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error registering user {Email}", registerDto.Email);
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("login")]
        public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto loginDto)
        {
            try
            {
                // Enhanced validation
                var validationResult = ValidateLogin(loginDto);
                if (!validationResult.IsValid)
                {
                    return BadRequest(new { message = validationResult.ErrorMessage });
                }

                var result = await _authService.LoginAsync(loginDto);

                _logger.LogInformation("User logged in successfully: {Email}", loginDto.Email);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Login failed for user {Email}: {Message}", loginDto.Email, ex.Message);
                return Unauthorized(new { message = ex.Message });
            }
        }

        [Authorize]
        [HttpGet("me")]
        public async Task<ActionResult<UserDto>> GetCurrentUser()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
                var user = await _authService.GetCurrentUserAsync(userId);
                return Ok(user);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting current user");
                return NotFound(new { message = ex.Message });
            }
        }

        private ValidationResult ValidateRegistration(RegisterDto registerDto)
        {
            // Role validation
            if (string.IsNullOrWhiteSpace(registerDto.Role) ||
                (registerDto.Role != "Seller" && registerDto.Role != "Buyer"))
            {
                return new ValidationResult { IsValid = false, ErrorMessage = "Role must be either 'Seller' or 'Buyer'" };
            }

            // Username validation
            if (string.IsNullOrWhiteSpace(registerDto.Username) || registerDto.Username.Length < 3)
            {
                return new ValidationResult { IsValid = false, ErrorMessage = "Username must be at least 3 characters long" };
            }

            if (!Regex.IsMatch(registerDto.Username, @"^[a-zA-Z0-9_]+$"))
            {
                return new ValidationResult { IsValid = false, ErrorMessage = "Username can only contain letters, numbers, and underscores" };
            }

            // Email validation
            if (string.IsNullOrWhiteSpace(registerDto.Email))
            {
                return new ValidationResult { IsValid = false, ErrorMessage = "Email is required" };
            }

            if (!Regex.IsMatch(registerDto.Email, @"^[^@\s]+@[^@\s]+\.[^@\s]+$"))
            {
                return new ValidationResult { IsValid = false, ErrorMessage = "Please enter a valid email address" };
            }

            // Password validation
            if (string.IsNullOrWhiteSpace(registerDto.Password) || registerDto.Password.Length < 6)
            {
                return new ValidationResult { IsValid = false, ErrorMessage = "Password must be at least 6 characters long" };
            }

            if (!Regex.IsMatch(registerDto.Password, @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$"))
            {
                return new ValidationResult { IsValid = false, ErrorMessage = "Password must contain at least one uppercase letter, one lowercase letter, and one number" };
            }

            return new ValidationResult { IsValid = true };
        }

        private ValidationResult ValidateLogin(LoginDto loginDto)
        {
            // Email validation
            if (string.IsNullOrWhiteSpace(loginDto.Email))
            {
                return new ValidationResult { IsValid = false, ErrorMessage = "Email is required" };
            }

            if (!Regex.IsMatch(loginDto.Email, @"^[^@\s]+@[^@\s]+\.[^@\s]+$"))
            {
                return new ValidationResult { IsValid = false, ErrorMessage = "Please enter a valid email address" };
            }

            // Password validation
            if (string.IsNullOrWhiteSpace(loginDto.Password))
            {
                return new ValidationResult { IsValid = false, ErrorMessage = "Password is required" };
            }

            return new ValidationResult { IsValid = true };
        }
    }

    public class ValidationResult
    {
        public bool IsValid { get; set; }
        public string ErrorMessage { get; set; } = string.Empty;
    }
}