namespace UI.Models;

public class HomeViewModel
{
    public List<SidebarCategoryViewModel> Categories { get; set; } = new();
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
