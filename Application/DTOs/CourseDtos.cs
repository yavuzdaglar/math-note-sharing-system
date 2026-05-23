namespace Application.DTOs;

public class CourseDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int CourseCategoryId { get; set; }
    public string? CategoryName { get; set; }
}

public class CourseCreateDto
{
    public string Name { get; set; } = string.Empty;
    public int CourseCategoryId { get; set; }
}

public class CourseUpdateDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int CourseCategoryId { get; set; }
}