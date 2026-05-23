using Application.Interfaces;
using Entities;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("api/notes")]
public class NotesController : ControllerBase
{
    private readonly INoteService _noteService;

    public NotesController(INoteService noteService)
    {
        _noteService = noteService;
    }

    [HttpGet]
    public async Task<IActionResult> GetPublished(
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await _noteService.GetNotesAsync(NoteStatus.Published, search, page, pageSize, cancellationToken);
        if (!result.Succeeded)
        {
            return StatusCode(result.StatusCode, new { error = result.Error });
        }

        return Ok(result.Data);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetPublishedById(int id, CancellationToken cancellationToken)
    {
        var result = await _noteService.GetNoteByIdAsync(id, true, cancellationToken);
        if (!result.Succeeded)
        {
            return StatusCode(result.StatusCode, new { error = result.Error });
        }

        if (result.Data == null || result.Data.Status != NoteStatus.Published)
        {
            return NotFound();
        }

        return Ok(result.Data);
    }

    [HttpGet("course/{courseId:int}")]
    public async Task<IActionResult> GetByCourseId(int courseId, CancellationToken cancellationToken)
    {
        var result = await _noteService.GetNoteByCourseIdAsync(courseId, cancellationToken);
        if (!result.Succeeded) return StatusCode(result.StatusCode, new { error = result.Error });
        return Ok(result.Data);
    }
}
