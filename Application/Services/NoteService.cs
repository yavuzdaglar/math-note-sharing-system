using System.Text.Json;
using Application.DTOs;
using Application.Interfaces;
using Application.Models;
using Domain.Interfaces;
using Entities;

namespace Application.Services;

public class NoteService : INoteService
{
    private readonly INoteRepository _repository;

    public NoteService(INoteRepository repository)
    {
        _repository = repository;
    }

    public async Task<ServiceResult<PagedResult<NoteSummaryDto>>> GetNotesAsync(
        NoteStatus? status,
        string? search,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        if (page <= 0) page = 1;
        if (pageSize <= 0) pageSize = 20;
        if (pageSize > 100) pageSize = 100;

        var (items, totalCount) = await _repository.GetPagedAsync(status, search, page, pageSize, cancellationToken);

        var result = new PagedResult<NoteSummaryDto>
        {
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            Items = items.Select(n => new NoteSummaryDto
            {
                Id = n.Id,
                Title = n.Title,
                Slug = n.Slug,
                Status = n.Status,
                BlockCount = n.Blocks.Count,
                CourseId = n.CourseId,
                CourseName = n.Course?.Name,
                CourseCategoryName = n.Course?.CourseCategory?.Name,
                CreatedAtUtc = n.CreatedAtUtc,
                UpdatedAtUtc = n.UpdatedAtUtc,
                PublishedAtUtc = n.PublishedAtUtc
            }).ToList()
        };

        return ServiceResult<PagedResult<NoteSummaryDto>>.Success(result);
    }

    public async Task<ServiceResult<NoteDetailDto>> GetNoteByIdAsync(int id, bool includeBlocks, CancellationToken cancellationToken)
    {
        var note = await _repository.GetByIdAsync(id, includeBlocks, cancellationToken);
        if (note == null)
        {
            return ServiceResult<NoteDetailDto>.Fail("Not bulunamadi.", 404);
        }

        return ServiceResult<NoteDetailDto>.Success(MapNoteDetail(note, includeBlocks));
    }

    public async Task<ServiceResult<NoteDetailDto>> GetNoteByCourseIdAsync(int courseId, CancellationToken cancellationToken)
    {
        var note = await _repository.GetPublishedByCourseIdAsync(courseId, cancellationToken);
        if (note == null)
        {
            return ServiceResult<NoteDetailDto>.Fail("Bu derse ait yayinlanmiş not bulunamadi.", 404);
        }
        return ServiceResult<NoteDetailDto>.Success(MapNoteDetail(note, true));
    }

    public async Task<ServiceResult<NoteDetailDto>> CreateNoteAsync(NoteCreateDto dto, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(dto.Title))
        {
            return ServiceResult<NoteDetailDto>.Fail("Baslik zorunludur.", 400);
        }

        var now = DateTime.UtcNow;
        var isPublished = dto.Status.HasValue
            ? dto.Status.Value == NoteStatus.Published
            : dto.Publish == true;

        if (isPublished && !dto.CourseId.HasValue)
        {
            return ServiceResult<NoteDetailDto>.Fail("Yayinlamak icin ders secilmelidir.", 400);
        }

        if (dto.CourseId.HasValue)
        {
            var hasNote = await _repository.CourseHasNoteAsync(dto.CourseId.Value, null, cancellationToken);
            if (hasNote)
            {
                return ServiceResult<NoteDetailDto>.Fail("Bu ders zaten bir nota bagli.", 409);
            }
        }

        var note = new Note
        {
            Title = dto.Title.Trim(),
            Slug = string.IsNullOrWhiteSpace(dto.Slug) ? null : dto.Slug.Trim(),
            Summary = string.IsNullOrWhiteSpace(dto.Summary) ? null : dto.Summary.Trim(),
            CourseId = dto.CourseId,
            Status = isPublished ? NoteStatus.Published : NoteStatus.Draft,
            PublishedAtUtc = isPublished ? now : null,
            CreatedAtUtc = now,
            UpdatedAtUtc = now
        };

        if (dto.Blocks.Count > 0)
        {
            var validation = ValidateBlocks(dto.Blocks);
            if (!validation.Succeeded)
            {
                return ServiceResult<NoteDetailDto>.Fail(validation.Error ?? "Blok dogrulama hatasi.", validation.StatusCode);
            }
            note.Blocks = BuildBlocks(dto.Blocks, now);
            NormalizeOrder(note);
        }

        await _repository.AddAsync(note, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

        return ServiceResult<NoteDetailDto>.Success(MapNoteDetail(note, true), 201);
    }

    public async Task<ServiceResult<NoteDetailDto>> UpdateNoteAsync(int id, NoteUpdateDto dto, CancellationToken cancellationToken)
    {
        var note = await _repository.GetByIdAsync(id, true, cancellationToken);
        if (note == null) return ServiceResult<NoteDetailDto>.Fail("Not bulunamadi.", 404);

        if (string.IsNullOrWhiteSpace(dto.Title)) return ServiceResult<NoteDetailDto>.Fail("Baslik zorunludur.", 400);

        var now = DateTime.UtcNow;
        note.Title = dto.Title.Trim();
        note.Slug = string.IsNullOrWhiteSpace(dto.Slug) ? null : dto.Slug.Trim();
        note.Summary = string.IsNullOrWhiteSpace(dto.Summary) ? null : dto.Summary.Trim();
        note.CourseId = dto.CourseId;
        note.UpdatedAtUtc = now;

        if (dto.CourseId.HasValue)
        {
            var hasNote = await _repository.CourseHasNoteAsync(dto.CourseId.Value, note.Id, cancellationToken);
            if (hasNote)
            {
                return ServiceResult<NoteDetailDto>.Fail("Bu ders zaten bir nota bagli.", 409);
            }
        }

        // Yayınlama/Geri Çekme Durumu
        if (dto.Status.HasValue)
        {
            if (dto.Status.Value == NoteStatus.Published && note.Status != NoteStatus.Published)
            {
                note.Status = NoteStatus.Published;
                note.PublishedAtUtc ??= now;
            }
            else if (dto.Status.Value == NoteStatus.Draft && note.Status != NoteStatus.Draft)
            {
                note.Status = NoteStatus.Draft;
                note.PublishedAtUtc = null;
            }
        }

        if (note.Status == NoteStatus.Published && !note.CourseId.HasValue)
        {
            return ServiceResult<NoteDetailDto>.Fail("Yayinli not icin ders secilmelidir.", 400);
        }
        
        await _repository.SaveChangesAsync(cancellationToken);
        
        var updatedNote = await _repository.GetByIdAsync(id, true, cancellationToken);
        return ServiceResult<NoteDetailDto>.Success(MapNoteDetail(updatedNote!, true));
    }

    public async Task<ServiceResult<bool>> DeleteNoteAsync(int id, CancellationToken cancellationToken)
    {
        var note = await _repository.GetByIdAsync(id, false, cancellationToken);
        if (note == null)
        {
            return ServiceResult<bool>.Fail("Not bulunamadi.", 404);
        }

        _repository.Remove(note);
        await _repository.SaveChangesAsync(cancellationToken);
        return ServiceResult<bool>.Success(true);
    }

    public async Task<ServiceResult<List<BlockDto>>> AddBlocksAsync(int noteId, List<BlockUpsertDto> blocks, CancellationToken cancellationToken)
    {
        if (blocks.Count == 0)
        {
            return ServiceResult<List<BlockDto>>.Fail("En az bir blok gerekli.", 400);
        }

        var note = await _repository.GetByIdAsync(noteId, true, cancellationToken);
        if (note == null)
        {
            return ServiceResult<List<BlockDto>>.Fail("Not bulunamadi.", 404);
        }

        var validation = ValidateBlocks(blocks);
        if (!validation.Succeeded)
        {
            return ServiceResult<List<BlockDto>>.Fail(validation.Error ?? "Blok dogrulama hatasi.", validation.StatusCode);
        }

        var now = DateTime.UtcNow;
        var newBlocks = BuildBlocks(blocks, now);
        foreach (var block in newBlocks)
        {
            note.Blocks.Add(block);
        }

        note.UpdatedAtUtc = now;
        NormalizeOrder(note);

        await _repository.SaveChangesAsync(cancellationToken);

        var dto = note.Blocks
            .OrderBy(b => b.Order)
            .Select(MapBlock)
            .ToList();

        return ServiceResult<List<BlockDto>>.Success(dto);
    }

    public async Task<ServiceResult<List<BlockDto>>> UpsertBlocksAsync(int noteId, List<BlockUpsertDto> blocks, CancellationToken cancellationToken)
    {
        var note = await _repository.GetByIdAsync(noteId, true, cancellationToken);
        if (note == null) return ServiceResult<List<BlockDto>>.Fail("Not bulunamadı.", 404);

        var validation = ValidateBlocks(blocks);
        if (!validation.Succeeded) return ServiceResult<List<BlockDto>>.Fail(validation.Error ?? "Blok doğrulama hatası.", validation.StatusCode);

        var now = DateTime.UtcNow;
        var blockIdsToKeep = new HashSet<int>();

        foreach (var blockDto in blocks)
        {
            NoteBlock block;
            if (blockDto.Id > 0) // Güncelleme
            {
                block = note.Blocks.FirstOrDefault(b => b.Id == blockDto.Id);
                if (block == null) return ServiceResult<List<BlockDto>>.Fail($"Blok ID: {blockDto.Id} bulunamadı.", 404);
                
                block.Type = blockDto.Type;
                block.ContentJson = blockDto.Content.GetRawText();
                block.Order = blockDto.Order ?? block.Order;
                block.UpdatedAtUtc = now;
                blockIdsToKeep.Add(block.Id);
            }
            else // Ekleme
            {
                block = new NoteBlock
                {
                    Type = blockDto.Type,
                    Order = blockDto.Order ?? (note.Blocks.Any() ? note.Blocks.Max(b => b.Order) + 1 : 1),
                    ContentJson = blockDto.Content.GetRawText(),
                    CreatedAtUtc = now,
                    UpdatedAtUtc = now
                };
                note.Blocks.Add(block);
            }
        }

        // Silinmesi gereken blokları bul ve kaldır
        var blocksToRemove = note.Blocks.Where(b => b.Id > 0 && !blockIdsToKeep.Contains(b.Id)).ToList();
        foreach (var blockToRemove in blocksToRemove)
        {
            note.Blocks.Remove(blockToRemove);
        }

        note.UpdatedAtUtc = now;
        NormalizeOrder(note);

        await _repository.SaveChangesAsync(cancellationToken);

        var resultDto = note.Blocks.OrderBy(b => b.Order).Select(MapBlock).ToList();
        return ServiceResult<List<BlockDto>>.Success(resultDto, 200);
    }

    public async Task<ServiceResult<BlockDto>> UpdateBlockAsync(int noteId, int blockId, BlockUpsertDto block, CancellationToken cancellationToken)
    {
        var note = await _repository.GetByIdAsync(noteId, true, cancellationToken);
        if (note == null)
        {
            return ServiceResult<BlockDto>.Fail("Not bulunamadi.", 404);
        }

        var target = note.Blocks.FirstOrDefault(b => b.Id == blockId);
        if (target == null)
        {
            return ServiceResult<BlockDto>.Fail("Blok bulunamadi.", 404);
        }

        var validation = ValidateBlocks(new List<BlockUpsertDto> { block });
        if (!validation.Succeeded)
        {
            return ServiceResult<BlockDto>.Fail(validation.Error ?? "Blok dogrulama hatasi.", validation.StatusCode);
        }

        target.Type = block.Type;
        target.ContentJson = block.Content.GetRawText();
        if (block.Order.HasValue && block.Order.Value > 0)
        {
            target.Order = block.Order.Value;
        }

        target.UpdatedAtUtc = DateTime.UtcNow;
        note.UpdatedAtUtc = target.UpdatedAtUtc;
        NormalizeOrder(note);

        await _repository.SaveChangesAsync(cancellationToken);
        return ServiceResult<BlockDto>.Success(MapBlock(target));
    }

    public async Task<ServiceResult<bool>> DeleteBlockAsync(int noteId, int blockId, CancellationToken cancellationToken)
    {
        var note = await _repository.GetByIdAsync(noteId, true, cancellationToken);
        if (note == null)
        {
            return ServiceResult<bool>.Fail("Not bulunamadi.", 404);
        }

        var target = note.Blocks.FirstOrDefault(b => b.Id == blockId);
        if (target == null)
        {
            return ServiceResult<bool>.Fail("Blok bulunamadi.", 404);
        }

        note.Blocks.Remove(target);
        note.UpdatedAtUtc = DateTime.UtcNow;
        NormalizeOrder(note);

        await _repository.SaveChangesAsync(cancellationToken);
        return ServiceResult<bool>.Success(true);
    }

    public async Task<ServiceResult<bool>> ReorderBlocksAsync(int noteId, ReorderBlocksDto dto, CancellationToken cancellationToken)
    {
        if (dto.BlockIds.Count == 0)
        {
            return ServiceResult<bool>.Fail("Blok sirasi bos olamaz.", 400);
        }

        var note = await _repository.GetByIdAsync(noteId, true, cancellationToken);
        if (note == null)
        {
            return ServiceResult<bool>.Fail("Not bulunamadi.", 404);
        }

        if (dto.BlockIds.Count != note.Blocks.Count)
        {
            return ServiceResult<bool>.Fail("Blok sayisi uyusmuyor.", 400);
        }

        var orderMap = dto.BlockIds
            .Select((id, index) => new { id, order = index + 1 })
            .ToDictionary(x => x.id, x => x.order);

        foreach (var block in note.Blocks)
        {
            if (!orderMap.TryGetValue(block.Id, out var order))
            {
                return ServiceResult<bool>.Fail("Gecersiz blok listesi.", 400);
            }
            block.Order = order;
            block.UpdatedAtUtc = DateTime.UtcNow;
        }

        note.UpdatedAtUtc = DateTime.UtcNow;
        await _repository.SaveChangesAsync(cancellationToken);
        return ServiceResult<bool>.Success(true);
    }

    public async Task<ServiceResult<NoteDetailDto>> PublishAsync(int noteId, CancellationToken cancellationToken)
    {
        var note = await _repository.GetByIdAsync(noteId, true, cancellationToken);
        if (note == null)
        {
            return ServiceResult<NoteDetailDto>.Fail("Not bulunamadi.", 404);
        }

        if (!note.CourseId.HasValue)
        {
            return ServiceResult<NoteDetailDto>.Fail("Yayinlamak icin ders secilmelidir.", 400);
        }

        var hasNote = await _repository.CourseHasNoteAsync(note.CourseId.Value, note.Id, cancellationToken);
        if (hasNote)
        {
            return ServiceResult<NoteDetailDto>.Fail("Bu ders zaten bir nota bagli.", 409);
        }

        note.Status = NoteStatus.Published;
        note.PublishedAtUtc = DateTime.UtcNow;
        note.UpdatedAtUtc = note.PublishedAtUtc.Value;

        await _repository.SaveChangesAsync(cancellationToken);
        return ServiceResult<NoteDetailDto>.Success(MapNoteDetail(note, true));
    }

    public async Task<ServiceResult<NoteDetailDto>> UnpublishAsync(int noteId, CancellationToken cancellationToken)
    {
        var note = await _repository.GetByIdAsync(noteId, true, cancellationToken);
        if (note == null)
        {
            return ServiceResult<NoteDetailDto>.Fail("Not bulunamadi.", 404);
        }

        note.Status = NoteStatus.Draft;
        note.PublishedAtUtc = null;
        note.UpdatedAtUtc = DateTime.UtcNow;

        await _repository.SaveChangesAsync(cancellationToken);
        return ServiceResult<NoteDetailDto>.Success(MapNoteDetail(note, true));
    }

    private static NoteDetailDto MapNoteDetail(Note note, bool includeBlocks)
    {
        return new NoteDetailDto
        {
            Id = note.Id,
            Title = note.Title,
            Slug = note.Slug,
            Summary = note.Summary,
            Status = note.Status,
            CourseId = note.CourseId,
            CourseName = note.Course?.Name,
            CreatedAtUtc = note.CreatedAtUtc,
            UpdatedAtUtc = note.UpdatedAtUtc,
            PublishedAtUtc = note.PublishedAtUtc,
            Blocks = includeBlocks
                ? note.Blocks.OrderBy(b => b.Order).Select(MapBlock).ToList()
                : new List<BlockDto>()
        };
    }

    private static BlockDto MapBlock(NoteBlock block)
    {
        return new BlockDto
        {
            Id = block.Id,
            Type = block.Type,
            Order = block.Order,
            Content = ParseContent(block.ContentJson),
            CreatedAtUtc = block.CreatedAtUtc,
            UpdatedAtUtc = block.UpdatedAtUtc
        };
    }

    private static JsonElement ParseContent(string json)
    {
        using var doc = JsonDocument.Parse(json);
        return doc.RootElement.Clone();
    }

    private static List<NoteBlock> BuildBlocks(List<BlockUpsertDto> blocks, DateTime now)
    {
        var list = new List<NoteBlock>();
        var nextOrder = 1;

        foreach (var block in blocks)
        {
            var order = block.Order.HasValue && block.Order.Value > 0 ? block.Order.Value : nextOrder;
            list.Add(new NoteBlock
            {
                Type = block.Type,
                Order = order,
                ContentJson = block.Content.GetRawText(),
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            });
            nextOrder = Math.Max(nextOrder, order + 1);
        }

        return list;
    }

    private static void NormalizeOrder(Note note)
    {
        var ordered = note.Blocks
            .OrderBy(b => b.Order)
            .ThenBy(b => b.CreatedAtUtc)
            .ToList();

        for (var i = 0; i < ordered.Count; i++)
        {
            ordered[i].Order = i + 1;
        }
    }

    private static ServiceResult<bool> ValidateBlocks(List<BlockUpsertDto> blocks)
    {
        foreach (var block in blocks)
        {
            var error = ValidateBlockContent(block);
            if (error != null)
            {
                return ServiceResult<bool>.Fail(error, 400);
            }
        }

        return ServiceResult<bool>.Success(true);
    }

    private static string? ValidateBlockContent(BlockUpsertDto block)
    {
        if (block.Content.ValueKind != JsonValueKind.Object)
        {
            return "Blok content JSON obje olmali.";
        }

        switch (block.Type)
        {
            case NoteBlockType.Paragraph:
                if (!TryGetString(block.Content, "html", out _) && !TryGetString(block.Content, "text", out _))
                {
                    return "Metin bloklari icin 'html' veya 'text' zorunlu.";
                }
                return null;
            case NoteBlockType.Heading:
            case NoteBlockType.ImportantNote:
            case NoteBlockType.Quote:
                if (!TryGetString(block.Content, "text", out _))
                {
                    return "Metin bloklari icin 'text' zorunlu.";
                }
                return null;
            case NoteBlockType.Video:
                if (!TryGetString(block.Content, "url", out var videoUrl))
                {
                    return null;
                }
                return null;
            case NoteBlockType.Image:
                if (!TryGetString(block.Content, "url", out var imageUrl))
                {
                    return null;
                }
                return null;
            case NoteBlockType.DoubleImage:
                if (!TryGetStringArray(block.Content, "urls", 2))
                {
                    return "DoubleImage bloklari icin 2 adet 'urls' zorunlu.";
                }
                return null;
            case NoteBlockType.Code:
                if (!TryGetString(block.Content, "code", out _))
                {
                    return "Code bloklari icin 'code' zorunlu.";
                }
                return null;
            case NoteBlockType.List:
                if (!TryGetStringArray(block.Content, "items", 1))
                {
                    return "List bloklari icin en az 1 'items' zorunlu.";
                }
                return null;
            case NoteBlockType.Subheading:
                if (!TryGetStringLenient(block.Content, "text", out _))
                {
                    return "Alt baslik icin 'text' zorunlu.";
                }
                return null;
            default:
                return "Bilinmeyen blok tipi.";
        }
    }

    private static bool TryGetString(JsonElement content, string property, out string value)
    {
        value = string.Empty;
        if (!content.TryGetProperty(property, out var element))
        {
            return false;
        }

        if (element.ValueKind != JsonValueKind.String)
        {
            return false;
        }

        var raw = element.GetString();
        if (string.IsNullOrWhiteSpace(raw))
        {
            return false;
        }

        value = raw;
        return true;
    }

    private static bool TryGetStringLenient(JsonElement content, string property, out string value)
    {
        value = string.Empty;
        if (!content.TryGetProperty(property, out var element))
        {
            return false;
        }

        if (element.ValueKind != JsonValueKind.String)
        {
            return false;
        }

        value = element.GetString() ?? string.Empty;
        return true;
    }

    private static bool TryGetStringArray(JsonElement content, string property, int minLength)
    {
        if (!content.TryGetProperty(property, out var element))
        {
            return false;
        }

        if (element.ValueKind != JsonValueKind.Array)
        {
            return false;
        }

        var items = element.EnumerateArray().ToList();
        if (items.Count < minLength)
        {
            return false;
        }

        return items.Any(i => i.ValueKind == JsonValueKind.String && !string.IsNullOrWhiteSpace(i.GetString()));
    }

    private static bool IsValidUrl(string url)
    {
        return Uri.TryCreate(url, UriKind.Absolute, out var parsed) &&
               (parsed.Scheme == Uri.UriSchemeHttp || parsed.Scheme == Uri.UriSchemeHttps);
    }
}
