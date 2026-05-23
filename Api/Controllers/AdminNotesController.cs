using Application.DTOs;
using Application.Interfaces;
using Application.Models;
using Entities;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("api/admin/notes")]
public class AdminNotesController : ControllerBase
{
    private readonly INoteService _noteService;

    public AdminNotesController(INoteService noteService)
    {
        _noteService = noteService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] NoteStatus? status,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await _noteService.GetNotesAsync(status, search, page, pageSize, cancellationToken);
        return FromServiceResult(result);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var result = await _noteService.GetNoteByIdAsync(id, true, cancellationToken);
        return FromServiceResult(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] NoteCreateDto dto, CancellationToken cancellationToken)
    {
        var result = await _noteService.CreateNoteAsync(dto, cancellationToken);
        return FromServiceResult(result);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] NoteUpdateDto dto, CancellationToken cancellationToken)
    {
        var result = await _noteService.UpdateNoteAsync(id, dto, cancellationToken);
        return FromServiceResult(result);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var result = await _noteService.DeleteNoteAsync(id, cancellationToken);
        return FromServiceResult(result);
    }

    [HttpPost("{id:int}/blocks")]
    public async Task<IActionResult> UpsertBlocks(int id, [FromBody] List<BlockUpsertDto> blocks, CancellationToken cancellationToken)
    {
        var result = await _noteService.UpsertBlocksAsync(id, blocks, cancellationToken);
        return FromServiceResult(result);
    }

    [HttpPut("{id:int}/blocks/{blockId:int}")]
    public async Task<IActionResult> UpdateBlock(int id, int blockId, [FromBody] BlockUpsertDto block, CancellationToken cancellationToken)
    {
        var result = await _noteService.UpdateBlockAsync(id, blockId, block, cancellationToken);
        return FromServiceResult(result);
    }

    [HttpDelete("{id:int}/blocks/{blockId:int}")]
    public async Task<IActionResult> DeleteBlock(int id, int blockId, CancellationToken cancellationToken)
    {
        var result = await _noteService.DeleteBlockAsync(id, blockId, cancellationToken);
        return FromServiceResult(result);
    }

    [HttpPut("{id:int}/blocks/reorder")]
    public async Task<IActionResult> ReorderBlocks(int id, [FromBody] ReorderBlocksDto dto, CancellationToken cancellationToken)
    {
        var result = await _noteService.ReorderBlocksAsync(id, dto, cancellationToken);
        return FromServiceResult(result);
    }

    [HttpPost("{id:int}/publish")]
    public async Task<IActionResult> Publish(int id, CancellationToken cancellationToken)
    {
        var result = await _noteService.PublishAsync(id, cancellationToken);
        return FromServiceResult(result);
    }

    [HttpPost("{id:int}/unpublish")]
    public async Task<IActionResult> Unpublish(int id, CancellationToken cancellationToken)
    {
        var result = await _noteService.UnpublishAsync(id, cancellationToken);
        return FromServiceResult(result);
    }

    private IActionResult FromServiceResult<T>(ServiceResult<T> result)
    {
        if (result.Succeeded)
        {
            return StatusCode(result.StatusCode, result.Data);
        }

        return StatusCode(result.StatusCode, new { error = result.Error });
    }
}
