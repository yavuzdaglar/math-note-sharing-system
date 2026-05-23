using Application.DTOs;
using Application.Interfaces;
using Domain.Interfaces;
using Entities;

namespace Application.Services;

public class CourseService : ICourseService
{
    private readonly ICourseRepository _repository;

    public CourseService(ICourseRepository repository)
    {
        _repository = repository;
    }

    public List<CourseDto> GetAllCourses()
    {
        return _repository.GetAll().Select(e => new CourseDto 
        { 
            Id = e.Id, 
            Name = e.Name, 
            CourseCategoryId = e.CourseCategoryId,
            CategoryName = e.CourseCategory?.Name
        }).ToList();
    }

    public CourseDto? GetCourseById(int id)
    {
        var e = _repository.GetById(id);
        if (e == null) return null;
        return new CourseDto 
        { 
            Id = e.Id, 
            Name = e.Name, 
            CourseCategoryId = e.CourseCategoryId,
            CategoryName = e.CourseCategory?.Name 
        };
    }

    public void AddCourse(CourseCreateDto dto)
    {
        _repository.Add(new Course { Name = dto.Name, CourseCategoryId = dto.CourseCategoryId });
    }

    public void UpdateCourse(CourseUpdateDto dto)
    {
        _repository.Update(new Course { Id = dto.Id, Name = dto.Name, CourseCategoryId = dto.CourseCategoryId });
    }

    public void DeleteCourse(int id)
    {
        _repository.Delete(id);
    }
}