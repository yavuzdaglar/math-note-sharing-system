using System.Text.Json;
using Application.DTOs;
using Application.Interfaces;
using Application.Models;
using Application.Security;
using Application.StringExtensions;
using Domain.Exceptions;
using Domain.Interfaces;
using Entities;

namespace Application.Services;

public class NoteService : INoteService
{
    private const int MaxBlocksPerNote = 100;
    private const int MaxGridColumns = 6;
    private const int MaxDepth = 2;
    private const int MaxStringLength = 20_000;
    private const int MaxCodeLength = 500_000;

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
                Title = n.Title ?? string.Empty,
                Slug = n.Slug,
                Status = n.Status,
                BlockCount = n.BlockCount,
                CourseId = n.CourseId,
                CourseName = n.CourseName,
                CourseCategoryName = n.CourseCategoryName,
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
        if (!dto.Title.CleanLengthOk(1, 200)) return ServiceResult<NoteDetailDto>.Fail("Baslik 1-200 karakter olmalidir.", 400);
        if (dto.Blocks.Count > MaxBlocksPerNote) return ServiceResult<NoteDetailDto>.Fail($"Bir nota en fazla {MaxBlocksPerNote} blok eklenebilir.", 400);

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
            var validation = ValidateBlocks(dto.Blocks, depth: 0);
            if (!validation.Succeeded)
            {
                return ServiceResult<NoteDetailDto>.Fail(validation.Error ?? "Blok dogrulama hatasi.", validation.StatusCode);
            }
            note.Blocks = BuildBlocks(dto.Blocks, now);
            NormalizeOrder(note);
        }

        await _repository.AddAsync(note, cancellationToken);
        try
        {
            await _repository.SaveChangesAsync(cancellationToken);
        }
        catch (UniqueConstraintViolationException)
        {
            return ServiceResult<NoteDetailDto>.Fail("Bu ders zaten bir nota bagli.", 409);
        }

        return ServiceResult<NoteDetailDto>.Success(MapNoteDetail(note, true), 201);
    }

    public async Task<ServiceResult<NoteDetailDto>> UpdateNoteAsync(int id, NoteUpdateDto dto, CancellationToken cancellationToken)
    {
        var note = await _repository.GetByIdAsync(id, true, cancellationToken);
        if (note == null) return ServiceResult<NoteDetailDto>.Fail("Not bulunamadi.", 404);

        if (!dto.Title.CleanLengthOk(1, 200)) return ServiceResult<NoteDetailDto>.Fail("Baslik 1-200 karakter olmalidir.", 400);

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
        
        try
        {
            await _repository.SaveChangesAsync(cancellationToken);
        }
        catch (UniqueConstraintViolationException)
        {
            return ServiceResult<NoteDetailDto>.Fail("Bu ders zaten bir nota bagli.", 409);
        }
        
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

    public async Task<ServiceResult<List<BlockDto>>> UpsertBlocksAsync(int noteId, List<BlockUpsertDto> blocks, CancellationToken cancellationToken)
    {
        var note = await _repository.GetByIdAsync(noteId, true, cancellationToken);
        if (note == null) return ServiceResult<List<BlockDto>>.Fail("Not bulunamadı.", 404);

        if (blocks.Count > MaxBlocksPerNote) return ServiceResult<List<BlockDto>>.Fail($"Bir nota en fazla {MaxBlocksPerNote} blok eklenebilir.", 400);

        var validation = ValidateBlocks(blocks, depth: 0);
        if (!validation.Succeeded) return ServiceResult<List<BlockDto>>.Fail(validation.Error ?? "Blok doğrulama hatası.", validation.StatusCode);

        var now = DateTime.UtcNow;
        var blockIdsToKeep = new HashSet<int>();

        foreach (var blockDto in blocks)
        {
            NoteBlock block;
            if (blockDto.Id > 0) // Güncelleme
            {
                var existingBlock = note.Blocks.FirstOrDefault(b => b.Id == blockDto.Id);
                if (existingBlock == null) return ServiceResult<List<BlockDto>>.Fail($"Blok ID: {blockDto.Id} bulunamadı.", 404);
                block = existingBlock;
                
                block.Type = blockDto.Type;
                block.ContentJson = SanitizeBlock(blockDto.Type, blockDto.Content).GetRawText();
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
                    ContentJson = SanitizeBlock(blockDto.Type, blockDto.Content).GetRawText(),
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
        await SaveBlockOrderAsync(note, now, cancellationToken);

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

        var validation = ValidateBlocks(new List<BlockUpsertDto> { block }, depth: 0);
        if (!validation.Succeeded)
        {
            return ServiceResult<BlockDto>.Fail(validation.Error ?? "Blok dogrulama hatasi.", validation.StatusCode);
        }

        target.Type = block.Type;
        target.ContentJson = SanitizeBlock(block.Type, block.Content).GetRawText();
        if (block.Order.HasValue && block.Order.Value > 0)
        {
            target.Order = block.Order.Value;
        }

        var now = DateTime.UtcNow;
        target.UpdatedAtUtc = now;
        await SaveBlockOrderAsync(note, now, cancellationToken);
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
        await SaveBlockOrderAsync(note, DateTime.UtcNow, cancellationToken);
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
        }

        await SaveBlockOrderAsync(note, DateTime.UtcNow, cancellationToken);
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

        try
        {
            await _repository.SaveChangesAsync(cancellationToken);
        }
        catch (UniqueConstraintViolationException)
        {
            return ServiceResult<NoteDetailDto>.Fail("Bu ders zaten bir nota bagli.", 409);
        }
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
                ContentJson = SanitizeBlock(block.Type, block.Content).GetRawText(),
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

    // (NoteId, Order) benzersiz indeksi yüzünden ayni parti icinde Order degisimleri
    // EF Core'da döngüsel bagimlilik hatasina yol acabilir. Bunu onlemek icin siralar
    // iki fazda guncellenir: once hepsi benzersiz gecici degerlere tasinir, kaydedilir;
    // sonra gercek siralamaya gecilir ve tekrar kaydedilir.
    private async Task SaveBlockOrderAsync(Note note, DateTime now, CancellationToken cancellationToken)
    {
        const int tempOffset = 1_000_000;

        var ordered = note.Blocks
            .OrderBy(b => b.Order)
            .ThenBy(b => b.CreatedAtUtc)
            .ToList();

        for (var i = 0; i < ordered.Count; i++)
        {
            ordered[i].Order = i + 1 + tempOffset;
        }

        note.UpdatedAtUtc = now;
        await _repository.SaveChangesAsync(cancellationToken);

        for (var i = 0; i < ordered.Count; i++)
        {
            ordered[i].Order = i + 1;
        }

        await _repository.SaveChangesAsync(cancellationToken);
    }

    private static ServiceResult<bool> ValidateBlocks(List<BlockUpsertDto> blocks, int depth)
    {
        if (depth > MaxDepth) return ServiceResult<bool>.Fail("Blok ic ice cok derin.", 400);

        foreach (var block in blocks)
        {
            var error = ValidateBlockContent(block, depth);
            if (error != null)
            {
                return ServiceResult<bool>.Fail(error, 400);
            }
        }

        return ServiceResult<bool>.Success(true);
    }

    private static string? ValidateBlockContent(BlockUpsertDto block, int depth)
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
                return LimitStringProperties(block.Content, "html", "text");
            case NoteBlockType.Heading:
            case NoteBlockType.ImportantNote:
            case NoteBlockType.Quote:
            case NoteBlockType.Subheading:
                if (!TryGetString(block.Content, "text", out _) && !TryGetString(block.Content, "html", out _))
                {
                    return "Metin bloklari icin 'text' veya 'html' zorunlu.";
                }
                return LimitStringProperties(block.Content, "text", "html");
            case NoteBlockType.Video:
            case NoteBlockType.Image:
            case NoteBlockType.Gif:
                if (TryGetString(block.Content, "url", out var url))
                {
                    if (!IsSafeHttpUrl(url)) return "Gecersiz URL.";
                    return LimitStringProperties(block.Content, "url");
                }
                return null;
            case NoteBlockType.DoubleImage:
                return ValidateUrlArray(limit: MaxStringLength, block.Content, "urls", 2);
            case NoteBlockType.Code:
                if (!TryGetString(block.Content, "code", out _))
                {
                    return "Code bloklari icin 'code' zorunlu.";
                }
                if (TryGetString(block.Content, "code", out var code) && code.Length > MaxCodeLength)
                {
                    return "Code cok uzun.";
                }
                return null;
            case NoteBlockType.List:
                if (!TryGetStringArray(block.Content, "items", 1))
                {
                    return "List bloklari icin en az 1 'items' zorunlu.";
                }
                return ValidateUrlArray(MaxStringLength, block.Content, "items", 1);
            case NoteBlockType.Math:
                if (!TryGetString(block.Content, "latex", out _))
                {
                    return "Math bloklari icin 'latex' zorunlu.";
                }
                return LimitStringProperties(block.Content, "latex");
            case NoteBlockType.Grid:
                return ValidateGrid(block, depth);
            default:
                return "Bilinmeyen blok tipi.";
        }
    }

    private static string? ValidateGrid(BlockUpsertDto block, int depth)
    {
        if (depth >= MaxDepth) return "Grid bloklari daha fazla ic ice gecirilemez.";

        if (!block.Content.TryGetProperty("columns", out var colsEl) || colsEl.ValueKind != JsonValueKind.Array || colsEl.GetArrayLength() < 2 || colsEl.GetArrayLength() > MaxGridColumns)
        {
            return $"Grid en az 2, en fazla {MaxGridColumns} kolon icermelidir.";
        }
        if (!block.Content.TryGetProperty("columnBlocks", out var colBlocksEl) || colBlocksEl.ValueKind != JsonValueKind.Array)
        {
            return "Grid 'columnBlocks' zorunludur.";
        }
        if (colsEl.GetArrayLength() != colBlocksEl.GetArrayLength())
        {
            return "Grid 'columns' ve 'columnBlocks' esit sayida olmalidir.";
        }

        foreach (var colBlock in colBlocksEl.EnumerateArray())
        {
            if (colBlock.ValueKind != JsonValueKind.Array) continue;
            if (colBlock.GetArrayLength() > MaxBlocksPerNote)
            {
                return "Grid kolonunda cok fazla blok var.";
            }
            foreach (var sub in colBlock.EnumerateArray())
            {
                if (sub.ValueKind != JsonValueKind.Object) continue;
                if (!sub.TryGetProperty("type", out var typeEl) || typeEl.ValueKind != JsonValueKind.String)
                {
                    return "Grid icindeki bloklarda 'type' zorunludur.";
                }
                if (!sub.TryGetProperty("content", out var subContent) || subContent.ValueKind != JsonValueKind.Object)
                {
                    return "Grid icindeki bloklarda 'content' zorunludur.";
                }
                if (!Enum.TryParse<NoteBlockType>(typeEl.GetString(), true, out var subType))
                {
                    return "Bilinmeyen blok tipi.";
                }
                var subBlock = new BlockUpsertDto
                {
                    Type = subType,
                    Content = subContent
                };
                var subError = ValidateBlockContent(subBlock, depth + 1);
                if (subError != null) return subError;
            }
        }
        return null;
    }

    private static bool IsSafeHttpUrl(string url)
    {
        return Uri.TryCreate(url, UriKind.Absolute, out var uri)
            && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);
    }

    private static string? LimitStringProperties(JsonElement content, params string[] properties)
    {
        foreach (var prop in properties)
        {
            if (content.TryGetProperty(prop, out var el) && el.ValueKind == JsonValueKind.String && el.GetString()!.Length > MaxStringLength)
            {
                return "Deger cok uzun.";
            }
        }
        return null;
    }

    private static string? ValidateUrlArray(long limit, JsonElement content, string property, int minLength)
    {
        if (!content.TryGetProperty(property, out var element))
        {
            return $"{property} zorunlu.";
        }
        if (element.ValueKind != JsonValueKind.Array)
        {
            return $"{property} dizi olmali.";
        }
        var items = element.EnumerateArray().ToList();
        if (items.Count < minLength)
        {
            return $"{property} icin en az {minLength} ogrenci gerekli.";
        }
        if (items.Count > 100)
        {
            return $"{property} cok fazla (en fazla 100).";
        }
        foreach (var item in items)
        {
            if (item.ValueKind != JsonValueKind.String) continue;
            var s = item.GetString();
            if (s != null && s.Length > limit) return $"{property} iceren deger cok uzun.";
        }
        return null;
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

    /// <summary>
    /// Kullanici girdisi olabilecek HTML alanlarini beyaz liste ile temizler
    /// ve kaydedilmeden once XSS'e karsi arindirir.
    /// </summary>
    private static JsonElement SanitizeBlock(NoteBlockType type, JsonElement content)
    {
        if (content.ValueKind != JsonValueKind.Object)
        {
            return content.Clone();
        }

        var dict = new Dictionary<string, object?>();

        switch (type)
        {
            case NoteBlockType.Paragraph:
                if (content.TryGetProperty("html", out var htmlEl) && htmlEl.ValueKind == JsonValueKind.String)
                {
                    dict["html"] = HtmlSanitizerUtil.Sanitize(htmlEl.GetString());
                }
                break;
            case NoteBlockType.List:
                if (content.TryGetProperty("intro", out var introEl) && introEl.ValueKind == JsonValueKind.String)
                {
                    dict["intro"] = HtmlSanitizerUtil.Sanitize(introEl.GetString());
                }
                if (content.TryGetProperty("items", out var itemsEl) && itemsEl.ValueKind == JsonValueKind.Array)
                {
                    var items = itemsEl.EnumerateArray()
                        .Select(i => i.ValueKind == JsonValueKind.String
                            ? JsonSerializer.SerializeToElement(HtmlSanitizerUtil.Sanitize(i.GetString()))
                            : i.Clone())
                        .ToList();
                    dict["items"] = items;
                }
                break;
            case NoteBlockType.Grid:
                if (content.TryGetProperty("columnBlocks", out var gridColsEl) && gridColsEl.ValueKind == JsonValueKind.Array)
                {
                    var cleanedCols = gridColsEl.EnumerateArray().Select(col =>
                    {
                        if (col.ValueKind != JsonValueKind.Array) return col.Clone();

                        var cleanedCol = col.EnumerateArray().Select(sub =>
                        {
                            if (sub.ValueKind != JsonValueKind.Object) return sub.Clone();
                            if (!sub.TryGetProperty("type", out var subTypeEl) || subTypeEl.ValueKind != JsonValueKind.String)
                            {
                                return sub.Clone();
                            }
                            if (!Enum.TryParse<NoteBlockType>(subTypeEl.GetString(), true, out var subType))
                            {
                                return sub.Clone();
                            }
                            if (!sub.TryGetProperty("content", out var subContent) || subContent.ValueKind != JsonValueKind.Object)
                            {
                                return sub.Clone();
                            }

                            var cleanedSubContent = SanitizeBlock(subType, subContent);
                            var subDict = new Dictionary<string, object?>();
                            foreach (var prop in sub.EnumerateObject())
                            {
                                subDict[prop.Name] = prop.NameEquals("content") ? cleanedSubContent : prop.Value.Clone();
                            }
                            return JsonSerializer.SerializeToElement(subDict);
                        }).ToList();

                        return JsonSerializer.SerializeToElement(cleanedCol);
                    }).ToList();

                    dict["columnBlocks"] = cleanedCols;
                }
                break;
        }

        if (dict.Count == 0)
        {
            return content.Clone();
        }

        foreach (var prop in content.EnumerateObject())
        {
            if (!dict.ContainsKey(prop.Name))
            {
                dict[prop.Name] = prop.Value.Clone();
            }
        }

        return JsonSerializer.SerializeToElement(dict);
    }
}
