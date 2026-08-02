using Microsoft.AspNetCore.Mvc;

namespace UI.ViewComponents;

public class NavbarViewComponent : ViewComponent
{
    public IViewComponentResult Invoke()
    {
        return View();
    }
}
