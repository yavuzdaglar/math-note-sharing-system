using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc;

namespace UI.Controllers;

public class AccountController : Controller
{
    private readonly HttpClient _httpClient;

    public AccountController(IHttpClientFactory httpClientFactory)
    {
        _httpClient = httpClientFactory.CreateClient();
        _httpClient.BaseAddress = new Uri("https://localhost:7078/");
    }

    [HttpPost]
    public async Task<IActionResult> Login(string username, string password)
    {
        var formData = new FormUrlEncodedContent(new[]
        {
            new KeyValuePair<string, string>("Username", username),
            new KeyValuePair<string, string>("Password", password)
        });

        var response = await _httpClient.PostAsync("api/admin/auth/login", formData);
        var result = await response.Content.ReadFromJsonAsync<ApiLoginResponse>();

        if (result?.Success == true)
        {
            HttpContext.Session.SetString("IsAdmin", "true");
            return Json(new { success = true, redirectUrl = result.RedirectUrl ?? "/Admin" });
        }

        return Json(new { success = false, message = result?.Message ?? "Giriş başarısız!" });
    }

    public IActionResult Logout()
    {
        HttpContext.Session.Clear();
        return RedirectToAction("Index", "Home");
    }
}

public class ApiLoginResponse
{
    public bool Success { get; set; }
    public string? Message { get; set; }
    public string? RedirectUrl { get; set; }
}
