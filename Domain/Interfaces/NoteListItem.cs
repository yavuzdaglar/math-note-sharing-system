using Entities;

namespace Domain.Interfaces;

public class NoteListItem
{
    public int Id { get; set; }
    public string? Title { get; set; }
    public string? Slug { get; set; }
    public NoteStatus Status { get; set; }
    public int? CourseId { get; set; }
    public string? CourseName { get; set; }
    public string? CourseCategoryName { get; set; }
    public int BlockCount { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime UpdatedAtUtc { get; set; }
    public DateTime? PublishedAtUtc { get; set; }
}
