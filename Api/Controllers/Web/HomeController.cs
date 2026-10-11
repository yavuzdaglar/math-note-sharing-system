using Api.Models;
using Api.Services;
using Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers.Web;

public class HomeController : Controller
{
    private readonly ICourseCategoryService _categoryService;
    private readonly ICourseService _courseService;

    public HomeController(ICourseCategoryService categoryService, ICourseService courseService)
    {
        _categoryService = categoryService;
        _courseService = courseService;
    }

    public async Task<IActionResult> Index(CancellationToken cancellationToken)
    {
        // Tek host: API'ye HTTP ile gitmek yerine servislere direkt erisilir.
        var categories = await _categoryService.GetAllCategoriesAsync(cancellationToken);
        var courses = await _courseService.GetAllCoursesAsync(cancellationToken);

        var model = new HomeViewModel
        {
            Categories = CatalogViewModelBuilder.BuildCategories(categories, courses)
        };

        return View(model);
    }
}
