namespace Entities;

public class NoteBlock
{
    public int Id { get; set; }
    public int NoteId { get; set; }
    public Note Note { get; set; } = null!;
    public NoteBlockType Type { get; set; }
    public int Order { get; set; }
    public string ContentJson { get; set; } = "{}";
    public DateTime CreatedAtUtc { get; set; }
    public DateTime UpdatedAtUtc { get; set; }
}
