using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers.Web;

public class NotesController : Controller
{
    private bool IsAdmin => HttpContext.Session.GetString(AccountController.SessionIsAdminKey) == "true"
        && !string.IsNullOrEmpty(HttpContext.Session.GetString(AccountController.SessionTokenKey));

    private void SetApiViewBag()
    {
        // Tek host: ayni origin, API adresine gerek yok. JS relative /api/... kullanir.
        ViewBag.ApiBaseUrl = string.Empty;
        ViewBag.ApiToken = HttpContext.Session.GetString(AccountController.SessionTokenKey);
    }

    public IActionResult Index()
    {
        return RedirectToAction("Index", "Admin");
    }

    [Route("Notes/Editor")]
    [Route("Notes/Create")]
    public IActionResult Create()
    {
        if (!IsAdmin) return RedirectToAction("Index", "Home");
        ViewBag.NoteId = 0;
        SetApiViewBag();
        return View("Editor");
    }

    [Route("Notes/Edit/{id}")]
    public IActionResult Edit(int id)
    {
        if (!IsAdmin) return RedirectToAction("Index", "Home");
        ViewBag.NoteId = id;
        SetApiViewBag();
        return View("Editor");
    }
}
