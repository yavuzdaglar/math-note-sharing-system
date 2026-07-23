using System.Security.Cryptography;
using Application.DTOs;
using Application.Interfaces;
using Domain.Interfaces;

namespace Application.Services;

public class AdminAuthService : IAdminAuthService
{
    private readonly IAdminRepository _repository;

    public AdminAuthService(IAdminRepository repository)
    {
        _repository = repository;
    }

    public async Task<AdminLoginResponse> LoginAsync(AdminLoginRequest request, CancellationToken cancellationToken)
    {
        var admin = await _repository.GetByUsernameAsync(request.Username, cancellationToken);
        if (admin == null)
        {
            return new AdminLoginResponse { Success = false, Message = "Kullanıcı adı veya şifre hatalı!" };
        }

        var hash = HashPassword(request.Password, admin.Salt);
        if (hash != admin.PasswordHash)
        {
            return new AdminLoginResponse { Success = false, Message = "Kullanıcı adı veya şifre hatalı!" };
        }

        return new AdminLoginResponse
        {
            Success = true,
            Message = "Giriş başarılı.",
            RedirectUrl = "/Admin"
        };
    }

    public static string GenerateSalt()
    {
        var bytes = RandomNumberGenerator.GetBytes(32);
        return Convert.ToBase64String(bytes);
    }

    public static string HashPassword(string password, string salt)
    {
        var saltBytes = Convert.FromBase64String(salt);
        var passwordBytes = System.Text.Encoding.UTF8.GetBytes(password);
        var combined = new byte[saltBytes.Length + passwordBytes.Length];
        Buffer.BlockCopy(saltBytes, 0, combined, 0, saltBytes.Length);
        Buffer.BlockCopy(passwordBytes, 0, combined, saltBytes.Length, passwordBytes.Length);
        var hash = SHA256.HashData(combined);
        return Convert.ToBase64String(hash);
    }
}
