using System.Text.Json;
using Entities;

namespace Application.DTOs;

public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

public class NoteSummaryDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public NoteStatus Status { get; set; }
    public int BlockCount { get; set; }
    public int? CourseId { get; set; }
    public string? CourseName { get; set; }
    public string? CourseCategoryName { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime UpdatedAtUtc { get; set; }
    public DateTime? PublishedAtUtc { get; set; }
}

public class NoteDetailDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string? Summary { get; set; }
    public NoteStatus Status { get; set; }
    public int? CourseId { get; set; }
    public string? CourseName { get; set; }
    public List<BlockDto> Blocks { get; set; } = new();
    public DateTime CreatedAtUtc { get; set; }
    public DateTime UpdatedAtUtc { get; set; }
    public DateTime? PublishedAtUtc { get; set; }
}

public class NoteCreateDto
{
    public string Title { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string? Summary { get; set; }
    public int? CourseId { get; set; }
    public List<BlockUpsertDto> Blocks { get; set; } = new();
    public NoteStatus? Status { get; set; }
    public bool? Publish { get; set; }
}

public class NoteUpdateDto
{
    public string Title { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string? Summary { get; set; }
    public int? CourseId { get; set; }
    public NoteStatus? Status { get; set; }
}

public class BlockUpsertDto
{
    public int Id { get; set; } = 0;
    public NoteBlockType Type { get; set; }
    public int? Order { get; set; }
    public JsonElement Content { get; set; }
}

public class BlockDto
{
    public int Id { get; set; }
    public NoteBlockType Type { get; set; }
    public int Order { get; set; }
    public JsonElement Content { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime UpdatedAtUtc { get; set; }
}

public class ReorderBlocksDto
{
    public List<int> BlockIds { get; set; } = new();
}
