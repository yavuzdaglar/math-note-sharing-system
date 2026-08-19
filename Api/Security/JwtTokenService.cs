using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Application.Interfaces;
using Microsoft.IdentityModel.Tokens;

namespace Api;

public class JwtTokenService(IConfiguration configuration) : ITokenService
{
    private const int TokenLifetimeHours = 2;

    public (string Token, DateTime ExpiresAtUtc) CreateToken(int adminId, string username)
    {
        var key = configuration["Jwt:Key"]
            ?? throw new InvalidOperationException("Jwt:Key yapilandirilmadi.");

        var expiresAtUtc = DateTime.UtcNow.AddHours(TokenLifetimeHours);
        var claims = new[]
        {
            new Claim("nameid", adminId.ToString()),
            new Claim("name", username),
            new Claim("role", "Admin")
        };

        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: configuration["Jwt:Issuer"],
            audience: configuration["Jwt:Audience"],
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: expiresAtUtc,
            signingCredentials: credentials);

        return (new JwtSecurityTokenHandler().WriteToken(token), expiresAtUtc);
    }
}
