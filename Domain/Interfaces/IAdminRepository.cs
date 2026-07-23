using Entities;

namespace Domain.Interfaces;

public interface IAdminRepository
{
    Task<Admin?> GetByUsernameAsync(string username, CancellationToken cancellationToken);
    Task<bool> UsernameExistsAsync(string username, CancellationToken cancellationToken);
    Task AddAsync(Admin admin, CancellationToken cancellationToken);
    Task DeleteAsync(int id, CancellationToken cancellationToken);
    Task<List<Admin>> GetAllAsync(CancellationToken cancellationToken);
    Task SaveChangesAsync(CancellationToken cancellationToken);
}
