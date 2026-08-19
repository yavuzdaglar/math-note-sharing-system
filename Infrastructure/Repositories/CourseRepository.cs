using Domain.Interfaces;
using Entities;
using Infrastructure.Context;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class CourseRepository : ICourseRepository
{
    private readonly AppDbContext _context;

    public CourseRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<Course>> GetAllAsync(CancellationToken cancellationToken)
        => await _context.Courses.Include(x => x.CourseCategory).OrderBy(x => x.Id).ToListAsync(cancellationToken);

    public async Task<Course?> GetByIdAsync(int id, CancellationToken cancellationToken)
        => await _context.Courses.Include(x => x.CourseCategory).FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public async Task<bool> AddAsync(Course entity, CancellationToken cancellationToken)
    {
        await _context.Courses.AddAsync(entity, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> UpdateAsync(Course entity, CancellationToken cancellationToken)
    {
        var item = await GetByIdAsync(entity.Id, cancellationToken);
        if (item == null) return false;

        item.Name = entity.Name;
        item.CourseCategoryId = entity.CourseCategoryId;
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var item = await GetByIdAsync(id, cancellationToken);
        if (item == null) return false;

        var notes = await _context.Notes.Where(n => n.CourseId == id).ToListAsync(cancellationToken);
        if (notes.Count > 0)
        {
            var now = DateTime.UtcNow;
            foreach (var note in notes)
            {
                note.CourseId = null;
                if (note.Status == NoteStatus.Published)
                {
                    note.Status = NoteStatus.Draft;
                    note.PublishedAtUtc = null;
                }
                note.UpdatedAtUtc = now;
            }
        }

        _context.Courses.Remove(item);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
