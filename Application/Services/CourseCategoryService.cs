using Application.DTOs;
using Application.Interfaces;
using Domain.Interfaces;
using Entities;

namespace Application.Services;

public class CourseCategoryService : ICourseCategoryService
{
    private readonly ICourseCategoryRepository _repository;

    public CourseCategoryService(ICourseCategoryRepository repository)
    {
        _repository = repository;
    }
    
    public List<CourseCategoryDto> GetAllCategories()
    {
        var entities = _repository.GetAll();
        return entities.Select(e => new CourseCategoryDto { Id = e.Id, Name = e.Name }).ToList();
    }

    public CourseCategoryDto? GetCategoryById(int id)
    {
        var entity = _repository.GetById(id);
        if (entity == null) return null;
        
        return new CourseCategoryDto { Id = entity.Id, Name = entity.Name };
    }

    public void AddCategory(CourseCategoryCreateDto dto)
    {
        var entity = new CourseCategory { Name = dto.Name };
        _repository.Add(entity);
    }

    public void UpdateCategory(CourseCategoryUpdateDto dto)
    {
        var entity = new CourseCategory { Id = dto.Id, Name = dto.Name };
        _repository.Update(entity);
    }

    public void DeleteCategory(int id)
    {
        _repository.Delete(id);
    }
}