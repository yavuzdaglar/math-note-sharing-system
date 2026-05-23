using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace UI.Controllers;

public class AccountController : Controller
{
    [HttpPost]
    public IActionResult Login(string username, string password)
    {
        // İstendiği üzere basit kontrol: admin / admin123
        if (username == "admin" && password == "admin123")
        {
            HttpContext.Session.SetString("IsAdmin", "true");
            return Json(new { success = true, redirectUrl = "/Admin" });
        }

        return Json(new { success = false, message = "Kullanıcı adı veya şifre hatalı!" });
    }

    public IActionResult Logout()
    {
        HttpContext.Session.Clear();
        return RedirectToAction("Index", "Home");
    }
}
