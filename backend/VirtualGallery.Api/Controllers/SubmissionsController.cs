using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VirtualGallery.Api.Data;
using VirtualGallery.Api.DTOs.Submissions;
using VirtualGallery.Api.Enums;
using VirtualGallery.Api.Models;
using VirtualGallery.Api.Services;

namespace VirtualGallery.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SubmissionsController : ControllerBase
{
    private readonly ApplicationDbContext _dbContext;
    private readonly ITagService _tagService;

    public SubmissionsController(
        ApplicationDbContext dbContext,
        ITagService tagService)
    {
        _dbContext = dbContext;
        _tagService = tagService;
    }

    [Authorize]
    [HttpPost]
    public async Task<ActionResult<SubmissionResponseDto>> Create([FromBody] CreateSubmissionRequestDto request)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var exhibition = await _dbContext.Exhibitions
            .FirstOrDefaultAsync(e => e.Id == request.ExhibitionId);

        if (exhibition is null)
        {
            return BadRequest(new { message = "Выставка не найдена." });
        }

        var now = DateTime.UtcNow;
        if (now < exhibition.SubmissionStartDate || now > exhibition.SubmissionEndDate)
        {
            return BadRequest(new { message = "Приём заявок на эту выставку сейчас закрыт." });
        }

        var submission = new Submission
        {
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            Year = request.Year,
            ImageUrl = request.ImageUrl.Trim(),
            UserId = userId.Value,
            ExhibitionId = exhibition.Id,
            Status = SubmissionStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        var tags = await _tagService.GetOrCreateTagsAsync(request.Tags);

        foreach (var tag in tags)
        {
            submission.SubmissionTags.Add(new SubmissionTag
            {
                Submission = submission,
                TagId = tag.Id
            });
        }

        _dbContext.Submissions.Add(submission);
        await _dbContext.SaveChangesAsync();

        var createdSubmission = await _dbContext.Submissions
            .Include(s => s.User)
            .Include(s => s.Exhibition)
            .Include(s => s.SubmissionTags)
                .ThenInclude(st => st.Tag)
            .FirstAsync(s => s.Id == submission.Id);

        return CreatedAtAction(nameof(GetById), new { id = submission.Id }, MapSubmissionToDto(createdSubmission));
    }

    [Authorize]
    [HttpGet("my")]
    public async Task<ActionResult<IEnumerable<SubmissionResponseDto>>> GetMySubmissions()
    {
        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var submissions = await _dbContext.Submissions
            .Include(s => s.User)
            .Include(s => s.Exhibition)
            .Include(s => s.SubmissionTags)
                .ThenInclude(st => st.Tag)
            .Where(s => s.UserId == userId.Value)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();

        return Ok(submissions.Select(MapSubmissionToDto).ToList());
    }

    [Authorize]
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<SubmissionResponseDto>> GetById(Guid id)
    {
        var userId = GetCurrentUserId();
        var isAdmin = User.IsInRole("Admin");

        var submission = await _dbContext.Submissions
            .Include(s => s.User)
            .Include(s => s.Exhibition)
            .Include(s => s.SubmissionTags)
                .ThenInclude(st => st.Tag)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (submission is null)
        {
            return NotFound(new { message = "Заявка не найдена." });
        }

        if (!isAdmin && submission.UserId != userId)
        {
            return Forbid();
        }

        return Ok(MapSubmissionToDto(submission));
    }

    [Authorize]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var submission = await _dbContext.Submissions
            .FirstOrDefaultAsync(s => s.Id == id);

        if (submission is null)
        {
            return NotFound(new { message = "Заявка не найдена." });
        }

        if (submission.UserId != userId.Value)
        {
            return Forbid();
        }

        if (submission.Status != SubmissionStatus.Pending)
        {
            return BadRequest(new { message = "Можно удалить только заявку со статусом Pending." });
        }

        _dbContext.Submissions.Remove(submission);
        await _dbContext.SaveChangesAsync();

        return NoContent();
    }

    [Authorize(Roles = "Admin")]
    [HttpGet]
    public async Task<ActionResult<IEnumerable<SubmissionResponseDto>>> GetAll()
    {
        var submissions = await _dbContext.Submissions
            .Include(s => s.User)
            .Include(s => s.Exhibition)
            .Include(s => s.SubmissionTags)
                .ThenInclude(st => st.Tag)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();

        return Ok(submissions.Select(MapSubmissionToDto).ToList());
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("{id:guid}/review")]
    public async Task<ActionResult<SubmissionResponseDto>> Review(Guid id, [FromBody] ReviewSubmissionRequestDto request)
    {
        var submission = await _dbContext.Submissions
            .Include(s => s.User)
            .Include(s => s.Exhibition)
            .Include(s => s.SubmissionTags)
                .ThenInclude(st => st.Tag)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (submission is null)
        {
            return NotFound(new { message = "Заявка не найдена." });
        }

        if (submission.Status != SubmissionStatus.Pending)
        {
            return BadRequest(new { message = "Эта заявка уже была рассмотрена." });
        }

        submission.AdminComment = string.IsNullOrWhiteSpace(request.AdminComment)
            ? null
            : request.AdminComment.Trim();

        if (request.Approve)
        {
            submission.Status = SubmissionStatus.Approved;

            var artwork = new Artwork
            {
                Title = submission.Title,
                Description = submission.Description,
                Year = submission.Year,
                ImageUrl = submission.ImageUrl,
                AuthorId = submission.UserId,
                ExhibitionId = submission.ExhibitionId,
                IsHidden = false,
                CreatedAt = DateTime.UtcNow
            };

            foreach (var submissionTag in submission.SubmissionTags)
            {
                artwork.ArtworkTags.Add(new ArtworkTag
                {
                    Artwork = artwork,
                    TagId = submissionTag.TagId
                });
            }

            _dbContext.Artworks.Add(artwork);
        }
        else
        {
            submission.Status = SubmissionStatus.Rejected;
        }

        await _dbContext.SaveChangesAsync();

        return Ok(MapSubmissionToDto(submission));
    }

    private Guid? GetCurrentUserId()
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (Guid.TryParse(userIdValue, out var userId))
        {
            return userId;
        }

        return null;
    }

    private static SubmissionResponseDto MapSubmissionToDto(Submission submission)
    {
        return new SubmissionResponseDto
        {
            Id = submission.Id,
            Title = submission.Title,
            Description = submission.Description,
            Year = submission.Year,
            ImageUrl = submission.ImageUrl,
            UserId = submission.UserId,
            UserName = submission.User?.Name ?? string.Empty,
            UserEmail = submission.User?.Email ?? string.Empty,
            ExhibitionId = submission.ExhibitionId,
            ExhibitionTitle = submission.Exhibition?.Title ?? string.Empty,
            ExhibitionTheme = submission.Exhibition?.Theme ?? string.Empty,
            Status = submission.Status.ToString(),
            AdminComment = submission.AdminComment,
            CreatedAt = submission.CreatedAt,
            Tags = submission.SubmissionTags
                .Where(st => st.Tag != null)
                .Select(st => st.Tag!.Name)
                .ToList()
        };
    }
}