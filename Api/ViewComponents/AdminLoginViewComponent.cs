using Microsoft.AspNetCore.Mvc;

namespace Api.ViewComponents;

public class AdminLoginViewComponent : ViewComponent
{
    public IViewComponentResult Invoke()
    {
        return View();
    }
}
