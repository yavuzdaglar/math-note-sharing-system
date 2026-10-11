using Application.DTOs;
using Application.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Api.Controllers.Web;

public class AccountController : Controller
{
    public const string SessionIsAdminKey = "IsAdmin";
    public const string SessionTokenKey = "AdminToken";
    public const string SessionUsernameKey = "AdminUsername";

    private readonly IAdminAuthService _authService;
    private readonly ITokenService _tokenService;

    public AccountController(IAdminAuthService authService, ITokenService tokenService)
    {
        _authService = authService;
        _tokenService = tokenService;
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    [EnableRateLimiting("login")]
    public async Task<IActionResult> Login(string username, string password, CancellationToken cancellationToken)
    {
        // Tek host: API'ye HTTP ile gitmek yerine servislere direkt erisilir.
        var result = await _authService.LoginAsync(
            new AdminLoginRequest { Username = username ?? string.Empty, Password = password ?? string.Empty },
            cancellationToken);

        if (!result.Success || !result.AdminId.HasValue || string.IsNullOrEmpty(result.Username))
        {
            return Json(new { success = false, message = result.Message ?? "Giriş başarısız!" });
        }

        var (token, _) = _tokenService.CreateToken(result.AdminId.Value, result.Username);

        // Oturum sabitleme (session fixation) korumasi: giris sonrasi yeni oturum.
        HttpContext.Session.Clear();
        HttpContext.Session.SetString(SessionIsAdminKey, "true");
        HttpContext.Session.SetString(SessionUsernameKey, result.Username);
        HttpContext.Session.SetString(SessionTokenKey, token);

        return Json(new { success = true, redirectUrl = result.RedirectUrl ?? "/Admin" });
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public IActionResult Logout()
    {
        HttpContext.Session.Clear();
        return Json(new { success = true, redirectUrl = "/" });
    }
}
