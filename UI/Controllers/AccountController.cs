using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc;

namespace UI.Controllers;

public class AccountController : Controller
{
    public const string SessionIsAdminKey = "IsAdmin";
    public const string SessionTokenKey = "AdminToken";
    public const string SessionUsernameKey = "AdminUsername";

    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;

    public AccountController(IHttpClientFactory httpClientFactory, IConfiguration configuration)
    {
        _httpClient = httpClientFactory.CreateClient();
        _httpClient.BaseAddress = new Uri(configuration["ApiBaseUrl"] ?? "https://localhost:7078/");
        _configuration = configuration;
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Login(string username, string password)
    {
        var formData = new FormUrlEncodedContent(new[]
        {
            new KeyValuePair<string, string>("Username", username),
            new KeyValuePair<string, string>("Password", password)
        });

        var response = await _httpClient.PostAsync("api/admin/auth/login", formData);

        if (response.StatusCode == System.Net.HttpStatusCode.TooManyRequests)
        {
            return Json(new { success = false, message = "Çok fazla giriş denemesi yapıldı. Lütfen bir dakika sonra tekrar deneyin." });
        }

        ApiLoginResponse? result = null;
        if (response.Content.Headers.ContentLength != 0)
        {
            try
            {
                result = await response.Content.ReadFromJsonAsync<ApiLoginResponse>();
            }
            catch (System.Text.Json.JsonException)
            {
                result = null;
            }
        }

        if (result?.Success == true)
        {
            // Oturum sabitleme (session fixation) korumasi: giris sonrasi yeni oturum.
            HttpContext.Session.Clear();
            HttpContext.Session.SetString(SessionIsAdminKey, "true");
            HttpContext.Session.SetString(SessionUsernameKey, result.Username ?? string.Empty);
            if (!string.IsNullOrEmpty(result.Token))
            {
                HttpContext.Session.SetString(SessionTokenKey, result.Token);
            }

            return Json(new { success = true, redirectUrl = result.RedirectUrl ?? "/Admin" });
        }

        return Json(new { success = false, message = result?.Message ?? "Giriş başarısız!" });
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public IActionResult Logout()
    {
        HttpContext.Session.Clear();
        return Json(new { success = true, redirectUrl = "/" });
    }
}

public class ApiLoginResponse
{
    public bool Success { get; set; }
    public string? Message { get; set; }
    public string? RedirectUrl { get; set; }
    public string? Username { get; set; }
    public string? Token { get; set; }
}
