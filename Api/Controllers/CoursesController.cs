using Application.DTOs;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CoursesController : ControllerBase
{
    private readonly ICourseService _courseService;

    public CoursesController(ICourseService courseService)
    {
        _courseService = courseService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        return Ok(await _courseService.GetAllCoursesAsync(cancellationToken));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var course = await _courseService.GetCourseByIdAsync(id, cancellationToken);
        if (course == null) return NotFound();
        return Ok(course);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> Add([FromBody] CourseCreateDto dto, CancellationToken cancellationToken)
    {
        var id = await _courseService.AddCourseAsync(dto, cancellationToken);
        if (id == null) return BadRequest("Ders adı 1-100 karakter olmalı ve kategori seçilmelidir.");
        return StatusCode(StatusCodes.Status201Created, new { id, name = dto.Name, courseCategoryId = dto.CourseCategoryId });
    }

    [Authorize(Roles = "Admin")]
    [HttpPut]
    public async Task<IActionResult> Update([FromBody] CourseUpdateDto dto, CancellationToken cancellationToken)
    {
        if (!await _courseService.UpdateCourseAsync(dto, cancellationToken)) return BadRequest("Ders bulunamadı veya ders adı çok uzun.");
        return Ok(new { id = dto.Id, name = dto.Name, courseCategoryId = dto.CourseCategoryId });
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        if (!await _courseService.DeleteCourseAsync(id, cancellationToken)) return NotFound("Ders bulunamadı.");
        return NoContent();
    }
}