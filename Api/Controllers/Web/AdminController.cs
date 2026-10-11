using Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers.Web;

public class AdminController : Controller
{
    private readonly ICourseCategoryService _categoryService;
    private readonly ICourseService _courseService;

    public AdminController(ICourseCategoryService categoryService, ICourseService courseService)
    {
        _categoryService = categoryService;
        _courseService = courseService;
    }

    [Route("Admin")]
    public async Task<IActionResult> Index(CancellationToken cancellationToken)
    {
        if (HttpContext.Session.GetString(AccountController.SessionIsAdminKey) != "true"
            || string.IsNullOrEmpty(HttpContext.Session.GetString(AccountController.SessionTokenKey)))
        {
            return RedirectToAction("Index", "Home");
        }

        // Tek host: ayni origin, API adresine gerek yok. JS relative /api/... kullanir.
        ViewBag.ApiBaseUrl = string.Empty;
        ViewBag.ApiToken = HttpContext.Session.GetString(AccountController.SessionTokenKey);

        var categories = await _categoryService.GetAllCategoriesAsync(cancellationToken);
        var courses = await _courseService.GetAllCoursesAsync(cancellationToken);

        ViewBag.Categories = categories;
        ViewBag.Courses = courses;

        return View();
    }
}
