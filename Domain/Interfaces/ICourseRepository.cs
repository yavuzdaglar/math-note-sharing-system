using Entities;

namespace Domain.Interfaces;

public interface ICourseRepository
{
    List<Course> GetAll();
    Course? GetById(int id);
    void Add(Course entity);
    void Update(Course entity);
    void Delete(int id);
}