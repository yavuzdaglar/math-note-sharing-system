using Application.DTOs;
using Application.Interfaces;
using Domain.Interfaces;
using Entities;

namespace Application.Services;

public class CourseService : ICourseService
{
    private const int NameMaxLength = 100;

    private readonly ICourseRepository _repository;

    public CourseService(ICourseRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<CourseDto>> GetAllCoursesAsync(CancellationToken cancellationToken)
    {
        var entities = await _repository.GetAllAsync(cancellationToken);
        return entities.Select(e => new CourseDto
        {
            Id = e.Id,
            Name = e.Name,
            CourseCategoryId = e.CourseCategoryId,
            CategoryName = e.CourseCategory?.Name
        }).ToList();
    }

    public async Task<CourseDto?> GetCourseByIdAsync(int id, CancellationToken cancellationToken)
    {
        var e = await _repository.GetByIdAsync(id, cancellationToken);
        if (e == null) return null;
        return new CourseDto
        {
            Id = e.Id,
            Name = e.Name,
            CourseCategoryId = e.CourseCategoryId,
            CategoryName = e.CourseCategory?.Name
        };
    }

    public async Task<int?> AddCourseAsync(CourseCreateDto dto, CancellationToken cancellationToken)
    {
        var name = dto.Name?.Trim() ?? string.Empty;
        if (string.IsNullOrEmpty(name) || name.Length > NameMaxLength || dto.CourseCategoryId <= 0) return null;

        var entity = new Course { Name = name, CourseCategoryId = dto.CourseCategoryId };
        if (!await _repository.AddAsync(entity, cancellationToken)) return null;
        return entity.Id;
    }

    public async Task<bool> UpdateCourseAsync(CourseUpdateDto dto, CancellationToken cancellationToken)
    {
        var name = dto.Name?.Trim() ?? string.Empty;
        if (name.Length > NameMaxLength) return false;

        return await _repository.UpdateAsync(new Course { Id = dto.Id, Name = name, CourseCategoryId = dto.CourseCategoryId }, cancellationToken);
    }

    public async Task<bool> DeleteCourseAsync(int id, CancellationToken cancellationToken)
    {
        return await _repository.DeleteAsync(id, cancellationToken);
    }
}
