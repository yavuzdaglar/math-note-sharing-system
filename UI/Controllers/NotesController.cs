using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace UI.Controllers;

public class NotesController : Controller
{
    private bool IsAdmin => HttpContext.Session.GetString("IsAdmin") == "true";

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
        return View("Editor");
    }

    [Route("Notes/Edit/{id}")]
    public IActionResult Edit(int id)
    {
        if (!IsAdmin) return RedirectToAction("Index", "Home");
        ViewBag.NoteId = id;
        return View("Editor");
    }
}
