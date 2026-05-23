using Application.DTOs;

namespace Application.Interfaces;

public interface ICourseCategoryService
{
    List<CourseCategoryDto> GetAllCategories();
    CourseCategoryDto? GetCategoryById(int id);
    void AddCategory(CourseCategoryCreateDto dto);
    void UpdateCategory(CourseCategoryUpdateDto dto);
    void DeleteCategory(int id);
}