using Application.DTOs;
using Application.Interfaces;
using Domain.Interfaces;
using Entities;

namespace Application.Services;

public class CourseCategoryService : ICourseCategoryService
{
    private const int NameMaxLength = 100;

    private readonly ICourseCategoryRepository _repository;

    public CourseCategoryService(ICourseCategoryRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<CourseCategoryDto>> GetAllCategoriesAsync(CancellationToken cancellationToken)
    {
        var entities = await _repository.GetAllAsync(cancellationToken);
        return entities.Select(e => new CourseCategoryDto { Id = e.Id, Name = e.Name }).ToList();
    }

    public async Task<CourseCategoryDto?> GetCategoryByIdAsync(int id, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdAsync(id, cancellationToken);
        if (entity == null) return null;
        return new CourseCategoryDto { Id = entity.Id, Name = entity.Name };
    }

    public async Task<int?> AddCategoryAsync(CourseCategoryCreateDto dto, CancellationToken cancellationToken)
    {
        var name = dto.Name?.Trim() ?? string.Empty;
        if (string.IsNullOrEmpty(name) || name.Length > NameMaxLength) return null;

        var entity = new CourseCategory { Name = name };
        if (!await _repository.AddAsync(entity, cancellationToken)) return null;
        return entity.Id;
    }

    public async Task<bool> UpdateCategoryAsync(CourseCategoryUpdateDto dto, CancellationToken cancellationToken)
    {
        var name = dto.Name?.Trim() ?? string.Empty;
        if (name.Length > NameMaxLength) return false;

        return await _repository.UpdateAsync(new CourseCategory { Id = dto.Id, Name = name }, cancellationToken);
    }

    public async Task<bool> DeleteCategoryAsync(int id, CancellationToken cancellationToken)
    {
        return await _repository.DeleteAsync(id, cancellationToken);
    }
}
