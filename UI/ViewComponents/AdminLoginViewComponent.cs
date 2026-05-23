using Microsoft.AspNetCore.Mvc;

namespace UI.ViewComponents;

public class AdminLoginViewComponent : ViewComponent
{
    public IViewComponentResult Invoke()
    {
        return View();
    }
}
