using Domain.Interfaces;
using Entities;
using Infrastructure.Context;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class CourseCategoryRepository : ICourseCategoryRepository
{
    private readonly AppDbContext _context;

    public CourseCategoryRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<CourseCategory>> GetAllAsync(CancellationToken cancellationToken)
        => await _context.CourseCategories.OrderBy(x => x.Id).ToListAsync(cancellationToken);

    public async Task<CourseCategory?> GetByIdAsync(int id, CancellationToken cancellationToken)
        => await _context.CourseCategories.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public async Task<bool> AddAsync(CourseCategory entity, CancellationToken cancellationToken)
    {
        await _context.CourseCategories.AddAsync(entity, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> UpdateAsync(CourseCategory entity, CancellationToken cancellationToken)
    {
        var item = await GetByIdAsync(entity.Id, cancellationToken);
        if (item == null) return false;

        item.Name = entity.Name;
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var item = await GetByIdAsync(id, cancellationToken);
        if (item == null) return false;

        _context.CourseCategories.Remove(item);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
