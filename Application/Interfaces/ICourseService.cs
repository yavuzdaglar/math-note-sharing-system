using Application.DTOs;

namespace Application.Interfaces;

public interface ICourseService
{
    List<CourseDto> GetAllCourses();
    CourseDto? GetCourseById(int id);
    void AddCourse(CourseCreateDto dto);
    void UpdateCourse(CourseUpdateDto dto);
    void DeleteCourse(int id);
}