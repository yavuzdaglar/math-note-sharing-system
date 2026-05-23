using Application.DTOs;
using UI.Models;

namespace UI.Services;

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
                        Id = $"course-{course.Id}",
                        Name = course.Name
                    })
                    .ToList()
            })
            .ToList();
    }
}
