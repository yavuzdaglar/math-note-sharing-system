using Microsoft.AspNetCore.Mvc;
using UI.Models;
using UI.Services;

namespace UI.Controllers;

public class CourseCategoriesController : Controller
{
    private readonly CourseCatalogClient _catalogClient;

    public CourseCategoriesController(CourseCatalogClient catalogClient)
    {
        _catalogClient = catalogClient;
    }

    public async Task<IActionResult> Index(CancellationToken cancellationToken)
    {
        var categories = await _catalogClient.GetCategoriesAsync(cancellationToken);
        var courses = await _catalogClient.GetCoursesAsync(cancellationToken);

        var model = new CourseCategoriesPageViewModel
        {
            Categories = CatalogViewModelBuilder.BuildCategories(categories, courses),
            CourseCategories = categories
        };

        return View(model);
    }
}
