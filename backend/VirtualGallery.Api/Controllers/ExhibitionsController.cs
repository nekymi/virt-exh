using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VirtualGallery.Api.Data;
using VirtualGallery.Api.DTOs.Exhibitions;
using VirtualGallery.Api.Models;

namespace VirtualGallery.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ExhibitionsController : ControllerBase
{
    private readonly ApplicationDbContext _dbContext;

    public ExhibitionsController(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ExhibitionResponseDto>>> GetAll()
    {
        var exhibitions = await _dbContext.Exhibitions
            .Include(e => e.Artworks)
            .OrderByDescending(e => e.CreatedAt)
            .ToListAsync();

        var result = exhibitions.Select(MapToListDto).ToList();

        return Ok(result);
    }

    [HttpGet("calendar")]
    public async Task<ActionResult<IEnumerable<ExhibitionCalendarItemDto>>> GetCalendar()
    {
        var exhibitions = await _dbContext.Exhibitions
            .OrderBy(e => e.StartDate)
            .ToListAsync();

        var result = exhibitions.Select(e => new ExhibitionCalendarItemDto
        {
            Id = e.Id,
            Title = e.Title,
            Theme = e.Theme,
            SubmissionStartDate = e.SubmissionStartDate,
            SubmissionEndDate = e.SubmissionEndDate,
            StartDate = e.StartDate,
            EndDate = e.EndDate,
            Status = GetExhibitionStatus(e)
        }).ToList();

        return Ok(result);
    }

    [HttpGet("active")]
    public async Task<ActionResult<IEnumerable<ExhibitionResponseDto>>> GetActive()
    {
        var now = DateTime.UtcNow;

        var exhibitions = await _dbContext.Exhibitions
            .Include(e => e.Artworks)
            .Where(e => now >= e.StartDate && now <= e.EndDate)
            .OrderBy(e => e.StartDate)
            .ToListAsync();

        return Ok(exhibitions.Select(MapToListDto).ToList());
    }

    [HttpGet("upcoming")]
    public async Task<ActionResult<IEnumerable<ExhibitionResponseDto>>> GetUpcoming()
    {
        var now = DateTime.UtcNow;

        var exhibitions = await _dbContext.Exhibitions
            .Include(e => e.Artworks)
            .Where(e => e.StartDate > now)
            .OrderBy(e => e.StartDate)
            .ToListAsync();

        return Ok(exhibitions.Select(MapToListDto).ToList());
    }

    [HttpGet("completed")]
    public async Task<ActionResult<IEnumerable<ExhibitionResponseDto>>> GetCompleted()
    {
        var now = DateTime.UtcNow;

        var exhibitions = await _dbContext.Exhibitions
            .Include(e => e.Artworks)
            .Where(e => e.EndDate < now)
            .OrderByDescending(e => e.EndDate)
            .ToListAsync();

        return Ok(exhibitions.Select(MapToListDto).ToList());
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ExhibitionDetailsDto>> GetById(Guid id)
    {
        var exhibition = await _dbContext.Exhibitions
            .Include(e => e.Artworks.Where(a => !a.IsHidden))
                .ThenInclude(a => a.Author)
            .Include(e => e.Artworks.Where(a => !a.IsHidden))
                .ThenInclude(a => a.ArtworkTags)
                    .ThenInclude(at => at.Tag)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (exhibition is null)
        {
            return NotFound(new { message = "Выставка не найдена." });
        }

        return Ok(MapToDetailsDto(exhibition));
    }

    [HttpGet("{id:guid}/virtual-room")]
    public async Task<ActionResult<VirtualRoomDto>> GetVirtualRoom(Guid id)
    {
        var exhibition = await _dbContext.Exhibitions
            .Include(e => e.Artworks.Where(a => !a.IsHidden))
                .ThenInclude(a => a.Author)
            .Include(e => e.Artworks.Where(a => !a.IsHidden))
                .ThenInclude(a => a.ArtworkTags)
                    .ThenInclude(at => at.Tag)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (exhibition is null)
        {
            return NotFound(new { message = "Выставка не найдена." });
        }

        var roomArtworks = exhibition.Artworks
            .Where(a => !a.IsHidden)
            .OrderBy(a => a.CreatedAt)
            .Take(30)
            .Select((a, index) => new VirtualRoomArtworkDto
            {
                Id = a.Id,
                Title = a.Title,
                Description = a.Description,
                Year = a.Year,
                ImageUrl = a.ImageUrl,
                AuthorName = a.Author?.Name ?? string.Empty,
                AuthorEmail = a.Author?.Email ?? string.Empty,
                Tags = a.ArtworkTags
                    .Where(at => at.Tag != null)
                    .Select(at => at.Tag!.Name)
                    .ToList(),
                PositionIndex = index
            })
            .ToList();

        var result = new VirtualRoomDto
        {
            ExhibitionId = exhibition.Id,
            ExhibitionTitle = exhibition.Title,
            ExhibitionTheme = exhibition.Theme,
            ExhibitionDescription = exhibition.Description,
            Status = GetExhibitionStatus(exhibition),
            MaxArtworks = 30,
            Artworks = roomArtworks
        };

        return Ok(result);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<ActionResult<ExhibitionResponseDto>> Create([FromBody] CreateExhibitionRequestDto request)
    {
        var validationError = ValidateDates(
            request.SubmissionStartDate,
            request.SubmissionEndDate,
            request.StartDate,
            request.EndDate);

        if (validationError is not null)
        {
            return BadRequest(new { message = validationError });
        }

        var exhibition = new Exhibition
        {
            Title = request.Title.Trim(),
            Theme = request.Theme.Trim(),
            Description = request.Description.Trim(),
            SubmissionStartDate = request.SubmissionStartDate,
            SubmissionEndDate = request.SubmissionEndDate,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.Exhibitions.Add(exhibition);
        await _dbContext.SaveChangesAsync();

        var response = MapToListDto(exhibition);

        return CreatedAtAction(nameof(GetById), new { id = exhibition.Id }, response);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ExhibitionResponseDto>> Update(Guid id, [FromBody] UpdateExhibitionRequestDto request)
    {
        var exhibition = await _dbContext.Exhibitions
            .Include(e => e.Artworks)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (exhibition is null)
        {
            return NotFound(new { message = "Выставка не найдена." });
        }

        var validationError = ValidateDates(
            request.SubmissionStartDate,
            request.SubmissionEndDate,
            request.StartDate,
            request.EndDate);

        if (validationError is not null)
        {
            return BadRequest(new { message = validationError });
        }

        exhibition.Title = request.Title.Trim();
        exhibition.Theme = request.Theme.Trim();
        exhibition.Description = request.Description.Trim();
        exhibition.SubmissionStartDate = request.SubmissionStartDate;
        exhibition.SubmissionEndDate = request.SubmissionEndDate;
        exhibition.StartDate = request.StartDate;
        exhibition.EndDate = request.EndDate;

        await _dbContext.SaveChangesAsync();

        return Ok(MapToListDto(exhibition));
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var exhibition = await _dbContext.Exhibitions
            .Include(e => e.Submissions)
            .Include(e => e.Artworks)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (exhibition is null)
        {
            return NotFound(new { message = "Выставка не найдена." });
        }

        if (exhibition.Submissions.Any() || exhibition.Artworks.Any())
        {
            return BadRequest(new
            {
                message = "Нельзя удалить выставку, у которой уже есть заявки или опубликованные работы."
            });
        }

        _dbContext.Exhibitions.Remove(exhibition);
        await _dbContext.SaveChangesAsync();

        return NoContent();
    }

    private static ExhibitionResponseDto MapToListDto(Exhibition exhibition)
    {
        return new ExhibitionResponseDto
        {
            Id = exhibition.Id,
            Title = exhibition.Title,
            Theme = exhibition.Theme,
            Description = exhibition.Description,
            SubmissionStartDate = exhibition.SubmissionStartDate,
            SubmissionEndDate = exhibition.SubmissionEndDate,
            StartDate = exhibition.StartDate,
            EndDate = exhibition.EndDate,
            CreatedAt = exhibition.CreatedAt,
            Status = GetExhibitionStatus(exhibition),
            ArtworkCount = exhibition.Artworks?.Count(a => !a.IsHidden) ?? 0
        };
    }

    private static ExhibitionDetailsDto MapToDetailsDto(Exhibition exhibition)
    {
        return new ExhibitionDetailsDto
        {
            Id = exhibition.Id,
            Title = exhibition.Title,
            Theme = exhibition.Theme,
            Description = exhibition.Description,
            SubmissionStartDate = exhibition.SubmissionStartDate,
            SubmissionEndDate = exhibition.SubmissionEndDate,
            StartDate = exhibition.StartDate,
            EndDate = exhibition.EndDate,
            CreatedAt = exhibition.CreatedAt,
            Status = GetExhibitionStatus(exhibition),
            ArtworkCount = exhibition.Artworks.Count(a => !a.IsHidden),
            Artworks = exhibition.Artworks
                .Where(a => !a.IsHidden)
                .OrderByDescending(a => a.CreatedAt)
                .Select(a => new ExhibitionArtworkItemDto
                {
                    Id = a.Id,
                    Title = a.Title,
                    Description = a.Description,
                    Year = a.Year,
                    ImageUrl = a.ImageUrl,
                    AuthorName = a.Author?.Name ?? string.Empty,
                    AuthorEmail = a.Author?.Email ?? string.Empty,
                    Tags = a.ArtworkTags
                        .Where(at => at.Tag != null)
                        .Select(at => at.Tag!.Name)
                        .ToList()
                })
                .ToList()
        };
    }

    private static string GetExhibitionStatus(Exhibition exhibition)
    {
        var now = DateTime.UtcNow;

        if (now >= exhibition.SubmissionStartDate && now <= exhibition.SubmissionEndDate)
        {
            return "Приём заявок открыт";
        }

        if (now < exhibition.StartDate)
        {
            return "Скоро начнётся";
        }

        if (now >= exhibition.StartDate && now <= exhibition.EndDate)
        {
            return "Активна";
        }

        return "Завершена";
    }

    private static string? ValidateDates(
        DateTime submissionStartDate,
        DateTime submissionEndDate,
        DateTime startDate,
        DateTime endDate)
    {
        if (submissionStartDate > submissionEndDate)
        {
            return "Дата начала приёма заявок не может быть позже даты окончания приёма.";
        }

        if (startDate > endDate)
        {
            return "Дата начала выставки не может быть позже даты окончания.";
        }

        if (submissionEndDate > startDate)
        {
            return "Приём заявок должен завершаться до начала выставки.";
        }

        return null;
    }
}