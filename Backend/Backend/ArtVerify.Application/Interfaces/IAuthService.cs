using ArtVerify.Application.DTOs;

namespace ArtVerify.Application.Interfaces
{
    public interface IAuthService
    {
        Task<AuthResponseDto> RegisterAsync(RegisterDto registerDto);
        Task<AuthResponseDto> LoginAsync(LoginDto loginDto);
        Task<UserDto> GetCurrentUserAsync(int userId);
    }
}