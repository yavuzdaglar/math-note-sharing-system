using Application.DTOs;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CourseCategoriesController : ControllerBase
{
    private readonly ICourseCategoryService _categoryService;

    public CourseCategoriesController(ICourseCategoryService categoryService)
    {
        _categoryService = categoryService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        return Ok(await _categoryService.GetAllCategoriesAsync(cancellationToken));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var category = await _categoryService.GetCategoryByIdAsync(id, cancellationToken);
        if (category == null) return NotFound();
        return Ok(category);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> Add([FromBody] CourseCategoryCreateDto dto, CancellationToken cancellationToken)
    {
        var id = await _categoryService.AddCategoryAsync(dto, cancellationToken);
        if (id == null) return BadRequest("Kategori adı 1-100 karakter olmalıdır.");
        return StatusCode(StatusCodes.Status201Created, new { id, name = dto.Name });
    }

    [Authorize(Roles = "Admin")]
    [HttpPut]
    public async Task<IActionResult> Update([FromBody] CourseCategoryUpdateDto dto, CancellationToken cancellationToken)
    {
        if (!await _categoryService.UpdateCategoryAsync(dto, cancellationToken)) return BadRequest("Kategori bulunamadı veya kategori adı çok uzun.");
        return Ok(new { id = dto.Id, name = dto.Name });
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        if (!await _categoryService.DeleteCategoryAsync(id, cancellationToken)) return NotFound("Kategori bulunamadı.");
        return NoContent();
    }
}