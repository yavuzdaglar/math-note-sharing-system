using Application.DTOs;
using System.Net.Http.Json;

namespace UI.Services;

public class CourseCatalogClient
{
    private readonly HttpClient _httpClient;

    public CourseCatalogClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<List<CourseCategoryDto>> GetCategoriesAsync(CancellationToken cancellationToken = default)
    {
        return await _httpClient.GetFromJsonAsync<List<CourseCategoryDto>>("api/CourseCategories", cancellationToken)
               ?? new List<CourseCategoryDto>();
    }

    public async Task<List<CourseDto>> GetCoursesAsync(CancellationToken cancellationToken = default)
    {
        return await _httpClient.GetFromJsonAsync<List<CourseDto>>("api/Courses", cancellationToken)
               ?? new List<CourseDto>();
    }
}
