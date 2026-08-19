using System.ComponentModel.DataAnnotations;

namespace Entities;

public class Note
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string? Summary { get; set; }
    public NoteStatus Status { get; set; } = NoteStatus.Draft;
    public DateTime CreatedAtUtc { get; set; }
    public DateTime UpdatedAtUtc { get; set; }
    public DateTime? PublishedAtUtc { get; set; }

    public int? CourseId { get; set; }
    public Course? Course { get; set; }

    [Timestamp]
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();

    public ICollection<NoteBlock> Blocks { get; set; } = new List<NoteBlock>();
}
