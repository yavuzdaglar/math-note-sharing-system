using Microsoft.AspNetCore.Mvc;

namespace Api.ViewComponents;

public class NavbarViewComponent : ViewComponent
{
    public IViewComponentResult Invoke()
    {
        return View();
    }
}
