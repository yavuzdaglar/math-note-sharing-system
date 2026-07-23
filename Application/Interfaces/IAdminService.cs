using Application.DTOs;

namespace Application.Interfaces;

public interface IAdminService
{
    Task<List<AdminDto>> GetAllAsync(CancellationToken cancellationToken);
    Task<AdminDto?> CreateAsync(CreateAdminRequest request, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
}
