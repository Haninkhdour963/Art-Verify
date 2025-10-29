namespace ArtVerify.Application.Interfaces
{
    public interface IJwtTokenGenerator
    {
        string GenerateToken(int userId, string username, string email, string role);
    }
}