using ArtVerify.Domain.Entities;
using System.Threading.Tasks;

namespace ArtVerify.Application.Interfaces
{
    public interface IAuthRepository
    {
        Task<User?> GetUserByEmailAsync(string email);
        Task<User?> GetUserByUsernameAsync(string username);
        Task<User?> GetUserByIdAsync(int userId);
        Task AddUserAsync(User user);
        Task SaveChangesAsync();
    }
}
