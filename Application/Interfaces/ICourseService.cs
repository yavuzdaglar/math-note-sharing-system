using Application.DTOs;

namespace Application.Interfaces;

public interface ICourseService
{
    Task<List<CourseDto>> GetAllCoursesAsync(CancellationToken cancellationToken = default);
    Task<CourseDto?> GetCourseByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<int?> AddCourseAsync(CourseCreateDto dto, CancellationToken cancellationToken = default);
    Task<bool> UpdateCourseAsync(CourseUpdateDto dto, CancellationToken cancellationToken = default);
    Task<bool> DeleteCourseAsync(int id, CancellationToken cancellationToken = default);
}
