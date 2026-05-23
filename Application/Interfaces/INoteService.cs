using Application.DTOs;
using Application.Models;
using Entities;

namespace Application.Interfaces;

public interface INoteService
{
    Task<ServiceResult<PagedResult<NoteSummaryDto>>> GetNotesAsync(
        NoteStatus? status,
        string? search,
        int page,
        int pageSize,
        CancellationToken cancellationToken);

    Task<ServiceResult<NoteDetailDto>> GetNoteByIdAsync(int id, bool includeBlocks, CancellationToken cancellationToken);
    Task<ServiceResult<NoteDetailDto>> GetNoteByCourseIdAsync(int courseId, CancellationToken cancellationToken);
    Task<ServiceResult<NoteDetailDto>> CreateNoteAsync(NoteCreateDto dto, CancellationToken cancellationToken);
    Task<ServiceResult<NoteDetailDto>> UpdateNoteAsync(int id, NoteUpdateDto dto, CancellationToken cancellationToken);
    Task<ServiceResult<bool>> DeleteNoteAsync(int id, CancellationToken cancellationToken);

    Task<ServiceResult<List<BlockDto>>> AddBlocksAsync(int noteId, List<BlockUpsertDto> blocks, CancellationToken cancellationToken);
    Task<ServiceResult<List<BlockDto>>> UpsertBlocksAsync(int noteId, List<BlockUpsertDto> blocks, CancellationToken cancellationToken);
    Task<ServiceResult<BlockDto>> UpdateBlockAsync(int noteId, int blockId, BlockUpsertDto block, CancellationToken cancellationToken);
    Task<ServiceResult<bool>> DeleteBlockAsync(int noteId, int blockId, CancellationToken cancellationToken);
    Task<ServiceResult<bool>> ReorderBlocksAsync(int noteId, ReorderBlocksDto dto, CancellationToken cancellationToken);

    Task<ServiceResult<NoteDetailDto>> PublishAsync(int noteId, CancellationToken cancellationToken);
    Task<ServiceResult<NoteDetailDto>> UnpublishAsync(int noteId, CancellationToken cancellationToken);
}
