using Application.DTOs;

namespace Application.Interfaces;

public interface ICourseCategoryService
{
    Task<List<CourseCategoryDto>> GetAllCategoriesAsync(CancellationToken cancellationToken = default);
    Task<CourseCategoryDto?> GetCategoryByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<int?> AddCategoryAsync(CourseCategoryCreateDto dto, CancellationToken cancellationToken = default);
    Task<bool> UpdateCategoryAsync(CourseCategoryUpdateDto dto, CancellationToken cancellationToken = default);
    Task<bool> DeleteCategoryAsync(int id, CancellationToken cancellationToken = default);
}
