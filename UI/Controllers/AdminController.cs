using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using UI.Services;

namespace UI.Controllers;

public class AdminController : Controller
{
    private readonly CourseCatalogClient _catalogClient;

    public AdminController(CourseCatalogClient catalogClient)
    {
        _catalogClient = catalogClient;
    }

    [Route("Admin")]
    public async Task<IActionResult> Index()
    {
        if (HttpContext.Session.GetString("IsAdmin") != "true")
        {
            return RedirectToAction("Index", "Home");
        }

        var categories = await _catalogClient.GetCategoriesAsync(default);
        var courses = await _catalogClient.GetCoursesAsync(default);
        
        ViewBag.Categories = categories;
        ViewBag.Courses = courses;
        
        return View();
    }
}
