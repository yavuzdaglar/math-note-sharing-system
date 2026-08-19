using System.Text.Json;
using Application.DTOs;
using Application.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Api.Controllers;

[ApiController]
[Route("api/admin/auth")]
[EnableRateLimiting("login")]
public class AdminAuthController : ControllerBase
{
    private readonly IAdminAuthService _authService;
    private readonly ITokenService _tokenService;

    public AdminAuthController(IAdminAuthService authService, ITokenService tokenService)
    {
        _authService = authService;
        _tokenService = tokenService;
    }

    [HttpPost("login")]
    [Consumes("application/json", "application/x-www-form-urlencoded", "multipart/form-data")]
    public async Task<IActionResult> Login(CancellationToken cancellationToken)
    {
        var request = await BindLoginRequestAsync(cancellationToken);

        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
        {
            return Ok(new AdminLoginResponse { Success = false, Message = "Kullanıcı adı veya şifre hatalı!" });
        }

        var result = await _authService.LoginAsync(request, cancellationToken);
        if (!result.Success || !result.AdminId.HasValue || string.IsNullOrEmpty(result.Username))
        {
            return Ok(result);
        }

        var (token, expiresAtUtc) = _tokenService.CreateToken(result.AdminId.Value, result.Username);
        result.Token = token;
        result.ExpiresAtUtc = expiresAtUtc;

        return Ok(result);
    }

    private async Task<AdminLoginRequest> BindLoginRequestAsync(CancellationToken cancellationToken)
    {
        var contentType = Request.ContentType ?? "";
        if (contentType.Contains("json", StringComparison.OrdinalIgnoreCase))
        {
            using var reader = new StreamReader(Request.Body);
            var json = await reader.ReadToEndAsync(cancellationToken);
            if (string.IsNullOrWhiteSpace(json)) return new AdminLoginRequest();
            try
            {
                return JsonSerializer.Deserialize<AdminLoginRequest>(
                           json,
                           new JsonSerializerOptions(JsonSerializerDefaults.Web))
                       ?? new AdminLoginRequest();
            }
            catch (JsonException)
            {
                return new AdminLoginRequest();
            }
        }

        var form = await Request.ReadFormAsync(cancellationToken);
        return new AdminLoginRequest
        {
            Username = GetFormValue(form, "username"),
            Password = GetFormValue(form, "password")
        };
    }

    private static string GetFormValue(IFormCollection form, string key)
    {
        foreach (var pair in form)
        {
            if (pair.Key.Equals(key, StringComparison.OrdinalIgnoreCase)) return pair.Value.ToString();
        }
        return string.Empty;
    }
}