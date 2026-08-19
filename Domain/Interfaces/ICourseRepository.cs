using Entities;

namespace Domain.Interfaces;

public interface ICourseRepository
{
    Task<List<Course>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<Course?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<bool> AddAsync(Course entity, CancellationToken cancellationToken = default);
    Task<bool> UpdateAsync(Course entity, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default);
}
