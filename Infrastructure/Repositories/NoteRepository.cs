using Domain.Interfaces;
using Entities;
using Infrastructure.Context;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class NoteRepository : INoteRepository
{
    private readonly AppDbContext _context;

    public NoteRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Note?> GetByIdAsync(int id, bool includeBlocks, CancellationToken cancellationToken)
    {
        IQueryable<Note> query = _context.Notes.Include(n => n.Course);
        if (includeBlocks)
        {
            query = query.Include(n => n.Blocks);
        }

        return await query.FirstOrDefaultAsync(n => n.Id == id, cancellationToken);
    }

    public async Task<Note?> GetPublishedByCourseIdAsync(int courseId, CancellationToken cancellationToken)
    {
        return await _context.Notes.AsNoTracking()
            .Include(n => n.Course)
            .Include(n => n.Blocks)
            .FirstOrDefaultAsync(n => n.CourseId == courseId && n.Status == NoteStatus.Published, cancellationToken);
    }

    public async Task<bool> CourseHasNoteAsync(int courseId, int? excludeNoteId, CancellationToken cancellationToken)
    {
        return await _context.Notes.AsNoTracking()
            .AnyAsync(n => n.CourseId == courseId && (!excludeNoteId.HasValue || n.Id != excludeNoteId.Value), cancellationToken);
    }

    public async Task<(IReadOnlyList<Note> Items, int TotalCount)> GetPagedAsync(
        NoteStatus? status,
        string? search,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        IQueryable<Note> query = _context.Notes.AsNoTracking()
            .Include(n => n.Course)
                .ThenInclude(c => c.CourseCategory)
            .Include(n => n.Blocks);

        if (status.HasValue)
        {
            query = query.Where(n => n.Status == status.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(n => n.Title.Contains(search) || (n.Slug != null && n.Slug.Contains(search)));
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(n => n.UpdatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public Task AddAsync(Note note, CancellationToken cancellationToken)
    {
        _context.Notes.Add(note);
        return Task.CompletedTask;
    }

    public void Remove(Note note)
    {
        _context.Notes.Remove(note);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        return _context.SaveChangesAsync(cancellationToken);
    }
}
