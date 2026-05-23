using Entities;

namespace Domain.Interfaces;

public interface INoteRepository
{
    Task<Note?> GetByIdAsync(int id, bool includeBlocks, CancellationToken cancellationToken);
    Task<(IReadOnlyList<Note> Items, int TotalCount)> GetPagedAsync(
        NoteStatus? status,
        string? search,
        int page,
        int pageSize,
        CancellationToken cancellationToken);
    Task AddAsync(Note note, CancellationToken cancellationToken);
    void Remove(Note note);
    Task SaveChangesAsync(CancellationToken cancellationToken);
}
