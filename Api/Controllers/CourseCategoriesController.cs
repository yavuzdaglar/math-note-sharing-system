using Application.DTOs;
using Application.Interfaces;
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
    public IActionResult GetAll()
    {
        return Ok(_categoryService.GetAllCategories());
    }

    [HttpGet("{id}")]
    public IActionResult GetById(int id)
    {
        var category = _categoryService.GetCategoryById(id);
        if (category == null) return NotFound();
        return Ok(category);
    }

    [HttpPost]
    public IActionResult Add([FromBody] CourseCategoryCreateDto dto)
    {
        _categoryService.AddCategory(dto);
        return Ok("Kategori eklendi!");
    }

    [HttpPut]
    public IActionResult Update([FromBody] CourseCategoryUpdateDto dto)
    {
        _categoryService.UpdateCategory(dto);
        return Ok("Kategori güncellendi!");
    }

    [HttpDelete("{id}")]
    public IActionResult Delete(int id)
    {
        _categoryService.DeleteCategory(id);
        return Ok("Kategori silindi!");
    }
}