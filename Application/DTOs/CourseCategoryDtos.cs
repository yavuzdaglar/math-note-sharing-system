namespace Application.DTOs;

public class CourseCategoryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
}

public class CourseCategoryCreateDto
{
    public string Name { get; set; } = string.Empty;
}

public class CourseCategoryUpdateDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
}