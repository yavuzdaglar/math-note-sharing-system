using Microsoft.AspNetCore.Mvc;
using UI.Models;
using UI.Services;

namespace UI.Controllers;

public class HomeController : Controller
{
    private readonly CourseCatalogClient _catalogClient;

    public HomeController(CourseCatalogClient catalogClient)
    {
        _catalogClient = catalogClient;
    }

    public async Task<IActionResult> Index(CancellationToken cancellationToken)
    {
        var categories = await _catalogClient.GetCategoriesAsync(cancellationToken);
        var courses = await _catalogClient.GetCoursesAsync(cancellationToken);

        var model = new HomeViewModel
        {
            Categories = CatalogViewModelBuilder.BuildCategories(categories, courses)
        };

        return View(model);
    }
}
