using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace UI.ViewComponents;

public class NavbarViewComponent : ViewComponent
{
    public IViewComponentResult Invoke()
    {
        ViewData["IsAdmin"] = HttpContext.Session.GetString("IsAdmin") == "true";
        return View();
    }
}
