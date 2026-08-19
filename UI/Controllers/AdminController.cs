using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using UI.Services;

namespace UI.Controllers;

public class AdminController : Controller
{
    private readonly CourseCatalogClient _catalogClient;
    private readonly IConfiguration _configuration;

    public AdminController(CourseCatalogClient catalogClient, IConfiguration configuration)
    {
        _catalogClient = catalogClient;
        _configuration = configuration;
    }

    [Route("Admin")]
    public async Task<IActionResult> Index()
    {
        if (HttpContext.Session.GetString(AccountController.SessionIsAdminKey) != "true"
            || string.IsNullOrEmpty(HttpContext.Session.GetString(AccountController.SessionTokenKey)))
        {
            return RedirectToAction("Index", "Home");
        }

        ViewBag.ApiBaseUrl = (_configuration["ApiBaseUrl"] ?? "https://localhost:7078/").TrimEnd('/');
        ViewBag.ApiToken = HttpContext.Session.GetString(AccountController.SessionTokenKey);

        ViewBag.ApiBaseUrl = (_configuration["ApiBaseUrl"] ?? "https://localhost:7078/").TrimEnd('/');
        ViewBag.ApiToken = HttpContext.Session.GetString(AccountController.SessionTokenKey);

        var categories = await _catalogClient.GetCategoriesAsync(default);
        var courses = await _catalogClient.GetCoursesAsync(default);

        ViewBag.Categories = categories;
        ViewBag.Courses = courses;

        return View();
    }
}
