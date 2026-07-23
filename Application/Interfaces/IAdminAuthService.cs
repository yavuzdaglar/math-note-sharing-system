using Application.DTOs;

namespace Application.Interfaces;

public interface IAdminAuthService
{
    Task<AdminLoginResponse> LoginAsync(AdminLoginRequest request, CancellationToken cancellationToken);
}
