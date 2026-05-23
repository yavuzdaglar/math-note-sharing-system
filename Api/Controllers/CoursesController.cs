using Application.DTOs;
using Application.Interfaces;
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
    public IActionResult GetAll()
    {
        return Ok(_courseService.GetAllCourses());
    }

    [HttpGet("{id}")]
    public IActionResult GetById(int id)
    {
        var course = _courseService.GetCourseById(id);
        if (course == null) return NotFound();
        return Ok(course);
    }

    [HttpPost]
    public IActionResult Add([FromBody] CourseCreateDto dto)
    {
        _courseService.AddCourse(dto);
        return Ok("Ders eklendi!");
    }

    [HttpPut]
    public IActionResult Update([FromBody] CourseUpdateDto dto)
    {
        _courseService.UpdateCourse(dto);
        return Ok("Ders güncellendi!");
    }

    [HttpDelete("{id}")]
    public IActionResult Delete(int id)
    {
        _courseService.DeleteCourse(id);
        return Ok("Ders silindi!");
    }
}