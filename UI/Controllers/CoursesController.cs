using Microsoft.AspNetCore.Mvc;
using UI.Models;
using UI.Services;

namespace UI.Controllers;

public class CoursesController : Controller
{
    private readonly CourseCatalogClient _catalogClient;

    public CoursesController(CourseCatalogClient catalogClient)
    {
        _catalogClient = catalogClient;
    }

    public async Task<IActionResult> Index(CancellationToken cancellationToken)
    {
        var categories = await _catalogClient.GetCategoriesAsync(cancellationToken);
        var courses = await _catalogClient.GetCoursesAsync(cancellationToken);

        var model = new CoursesPageViewModel
        {
            Categories = CatalogViewModelBuilder.BuildCategories(categories, courses),
            Courses = courses
        };

        return View(model);
    }
}
