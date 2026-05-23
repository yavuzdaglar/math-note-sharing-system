using Microsoft.AspNetCore.Mvc;
using UI.Models;

namespace UI.ViewComponents;

public class SidebarViewComponent : ViewComponent
{
    public IViewComponentResult Invoke(IReadOnlyList<SidebarCategoryViewModel>? categories)
    {
        return View(categories ?? Array.Empty<SidebarCategoryViewModel>());
    }
}
