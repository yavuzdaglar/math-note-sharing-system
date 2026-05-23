namespace UI.Models;

public class HomeViewModel
{
    public List<SidebarCategoryViewModel> Categories { get; set; } = new();
}

public class CoursesPageViewModel
{
    public List<SidebarCategoryViewModel> Categories { get; set; } = new();
    public List<Application.DTOs.CourseDto> Courses { get; set; } = new();
}

public class CourseCategoriesPageViewModel
{
    public List<SidebarCategoryViewModel> Categories { get; set; } = new();
    public List<Application.DTOs.CourseCategoryDto> CourseCategories { get; set; } = new();
}

public class SidebarCategoryViewModel
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public List<SidebarCourseViewModel> Courses { get; set; } = new();
}

public class SidebarCourseViewModel
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
}
