using Entities;

namespace Domain.Interfaces;

public interface ICourseCategoryRepository
{
    Task<List<CourseCategory>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<CourseCategory?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<bool> AddAsync(CourseCategory entity, CancellationToken cancellationToken = default);
    Task<bool> UpdateAsync(CourseCategory entity, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default);
}
