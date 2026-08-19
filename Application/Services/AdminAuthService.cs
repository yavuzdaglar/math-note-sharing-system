using System.Security.Cryptography;
using System.Text;
using Application.DTOs;
using Application.Interfaces;
using Domain.Interfaces;

namespace Application.Services;

public class AdminAuthService : IAdminAuthService
{
    private const int Pbkdf2Iterations = 200_000;
    private const int SaltSize = 32;
    private const int HashSize = 32;
    private const string Pbkdf2Prefix = "pbkdf2";

    private readonly IAdminRepository _repository;

    public AdminAuthService(IAdminRepository repository)
    {
        _repository = repository;
    }

    public async Task<AdminLoginResponse> LoginAsync(AdminLoginRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
        {
            return new AdminLoginResponse { Success = false, Message = "Kullanıcı adı veya şifre hatalı!" };
        }

        var admin = await _repository.GetByUsernameAsync(request.Username.Trim(), cancellationToken);
        if (admin == null)
        {
            return new AdminLoginResponse { Success = false, Message = "Kullanıcı adı veya şifre hatalı!" };
        }

        if (!VerifyPassword(request.Password, admin.PasswordHash, admin.Salt))
        {
            return new AdminLoginResponse { Success = false, Message = "Kullanıcı adı veya şifre hatalı!" };
        }

        // Eski SHA256 hash'lerini giris basariyla yapildiginda PBKDF2'ye gecir (lazy rehash)
        if (IsLegacyHash(admin.PasswordHash))
        {
            admin.Salt = GenerateSalt();
            admin.PasswordHash = HashPassword(request.Password, admin.Salt);
            await _repository.SaveChangesAsync(cancellationToken);
        }

        return new AdminLoginResponse
        {
            Success = true,
            Message = "Giriş başarılı.",
            RedirectUrl = "/Admin",
            AdminId = admin.Id,
            Username = admin.Username
        };
    }

    public static string GenerateSalt()
    {
        return Convert.ToBase64String(RandomNumberGenerator.GetBytes(SaltSize));
    }

    /// <summary>
    /// PBKDF2-SHA256 (200k iterasyon) ile parola hash'ler. Format: pbkdf2$iterations$salt$hash
    /// </summary>
    public static string HashPassword(string password, string salt)
    {
        var saltBytes = Convert.FromBase64String(salt);
        var derived = Rfc2898DeriveBytes.Pbkdf2(
            password, saltBytes, Pbkdf2Iterations, HashAlgorithmName.SHA256, HashSize);
        return $"{Pbkdf2Prefix}${Pbkdf2Iterations}${Convert.ToBase64String(saltBytes)}${Convert.ToBase64String(derived)}";
    }

    /// <summary>
    /// PBKDF2 hash formatini dogrular; eski SHA256 hash'lerini de legacy olarak kontrol eder.
    /// </summary>
    public static bool VerifyPassword(string password, string storedPasswordHash, string storedSalt)
    {
        if (string.IsNullOrEmpty(storedPasswordHash)) return false;

        if (storedPasswordHash.StartsWith(Pbkdf2Prefix + "$", StringComparison.Ordinal))
        {
            var parts = storedPasswordHash.Split('$');
            if (parts.Length != 4) return false;
            if (!int.TryParse(parts[1], out var iterations) || iterations <= 0) return false;

            try
            {
                var saltBytes = Convert.FromBase64String(parts[2]);
                var expected = Convert.FromBase64String(parts[3]);
                var actual = Rfc2898DeriveBytes.Pbkdf2(
                    password, saltBytes, iterations, HashAlgorithmName.SHA256, expected.Length);
                return CryptographicOperations.FixedTimeEquals(actual, expected);
            }
            catch (FormatException)
            {
                return false;
            }
        }

        // Legacy: tek tur SHA256(salt + password)
        var legacy = LegacyHash(password, storedSalt);
        var a = Encoding.UTF8.GetBytes(legacy);
        var b = Encoding.UTF8.GetBytes(storedPasswordHash);
        return a.Length == b.Length && CryptographicOperations.FixedTimeEquals(a, b);
    }

    public static bool IsLegacyHash(string storedPasswordHash)
    {
        return !string.IsNullOrEmpty(storedPasswordHash)
            && !storedPasswordHash.StartsWith(Pbkdf2Prefix + "$", StringComparison.Ordinal);
    }

    private static string LegacyHash(string password, string salt)
    {
        var saltBytes = Convert.FromBase64String(salt);
        var passwordBytes = Encoding.UTF8.GetBytes(password);
        var combined = new byte[saltBytes.Length + passwordBytes.Length];
        Buffer.BlockCopy(saltBytes, 0, combined, 0, saltBytes.Length);
        Buffer.BlockCopy(passwordBytes, 0, combined, saltBytes.Length, passwordBytes.Length);
        return Convert.ToBase64String(SHA256.HashData(combined));
    }
}