using Application.DTOs;
using Application.Interfaces;
using Domain.Interfaces;
using Entities;

namespace Application.Services;

public class AdminService : IAdminService
{
    private const int UsernameMinLength = 3;
    private const int UsernameMaxLength = 50;
    private const int PasswordMinLength = 8;

    private readonly IAdminRepository _repository;

    public AdminService(IAdminRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<AdminDto>> GetAllAsync(CancellationToken cancellationToken)
    {
        var admins = await _repository.GetAllAsync(cancellationToken);
        return admins.Select(a => new AdminDto
        {
            Id = a.Id,
            Username = a.Username,
            CreatedAtUtc = a.CreatedAtUtc
        }).ToList();
    }

    public async Task<AdminDto?> CreateAsync(CreateAdminRequest request, CancellationToken cancellationToken)
    {
        var username = request.Username?.Trim() ?? string.Empty;
        var password = request.Password ?? string.Empty;

        if (username.Length < UsernameMinLength || username.Length > UsernameMaxLength)
            return null;
        if (password.Length < PasswordMinLength)
            return null;

        var exists = await _repository.UsernameExistsAsync(username, cancellationToken);
        if (exists) return null;

        var salt = AdminAuthService.GenerateSalt();
        var admin = new Admin
        {
            Username = username,
            Salt = salt,
            PasswordHash = AdminAuthService.HashPassword(password, salt),
            CreatedAtUtc = DateTime.UtcNow
        };

        await _repository.AddAsync(admin, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

        return new AdminDto
        {
            Id = admin.Id,
            Username = admin.Username,
            CreatedAtUtc = admin.CreatedAtUtc
        };
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        await _repository.DeleteAsync(id, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);
        return true;
    }
}