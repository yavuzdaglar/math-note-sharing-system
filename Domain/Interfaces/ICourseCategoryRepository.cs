using Entities;

namespace Domain.Interfaces;

public interface ICourseCategoryRepository
{
    List<CourseCategory> GetAll();
    CourseCategory? GetById(int id);
    void Add(CourseCategory entity);
    void Update(CourseCategory entity);
    void Delete(int id);
}