using Api.Models;
using Microsoft.AspNetCore.Mvc;

namespace Api.ViewComponents;

public class SidebarViewComponent : ViewComponent
{
    public IViewComponentResult Invoke(IReadOnlyList<SidebarCategoryViewModel>? categories)
    {
        return View(categories ?? Array.Empty<SidebarCategoryViewModel>());
    }
}
