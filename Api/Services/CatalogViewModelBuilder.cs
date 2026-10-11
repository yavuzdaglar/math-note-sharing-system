using Api.Models;
using Application.DTOs;

namespace Api.Services;

public static class CatalogViewModelBuilder
{
    public static List<SidebarCategoryViewModel> BuildCategories(
        IEnumerable<CourseCategoryDto> categories,
        IEnumerable<CourseDto> courses)
    {
        return categories
            .OrderBy(c => c.Id)
            .Select(category => new SidebarCategoryViewModel
            {
                Id = $"cat-{category.Id}",
                Name = category.Name,
                Courses = courses
                    .Where(c => c.CourseCategoryId == category.Id)
                    .OrderBy(c => c.Id)
                    .Select(course => new SidebarCourseViewModel
                    {
                        Id = course.Id.ToString(),
                        Name = course.Name
                    })
                    .ToList()
            })
            .ToList();
    }
}
