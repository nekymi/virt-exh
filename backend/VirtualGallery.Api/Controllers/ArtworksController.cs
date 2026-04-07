using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VirtualGallery.Api.Data;
using VirtualGallery.Api.DTOs.Artworks;
using VirtualGallery.Api.Models;

namespace VirtualGallery.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ArtworksController : ControllerBase
{
    private readonly ApplicationDbContext _dbContext;

    public ArtworksController(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ArtworkResponseDto>>> GetAll(
        [FromQuery] string? search,
        [FromQuery] string? author,
        [FromQuery] string? tag,
        [FromQuery] Guid? exhibitionId)
    {
        var query = _dbContext.Artworks
            .Include(a => a.Author)
            .Include(a => a.Exhibition)
            .Include(a => a.ArtworkTags)
                .ThenInclude(at => at.Tag)
            .Where(a => !a.IsHidden)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var normalizedSearch = search.Trim().ToLower();
            query = query.Where(a => a.Title.ToLower().Contains(normalizedSearch));
        }

        if (!string.IsNullOrWhiteSpace(author))
        {
            var normalizedAuthor = author.Trim().ToLower();
            query = query.Where(a => a.Author != null && a.Author.Name.ToLower().Contains(normalizedAuthor));
        }

        if (!string.IsNullOrWhiteSpace(tag))
        {
            var normalizedTag = tag.Trim().ToLower();
            query = query.Where(a => a.ArtworkTags.Any(at => at.Tag != null && at.Tag.Name == normalizedTag));
        }

        if (exhibitionId.HasValue)
        {
            query = query.Where(a => a.ExhibitionId == exhibitionId.Value);
        }

        var artworks = await query
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();

        return Ok(artworks.Select(MapArtworkToDto).ToList());
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ArtworkResponseDto>> GetById(Guid id)
    {
        var artwork = await _dbContext.Artworks
            .Include(a => a.Author)
            .Include(a => a.Exhibition)
            .Include(a => a.ArtworkTags)
                .ThenInclude(at => at.Tag)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (artwork is null || artwork.IsHidden)
        {
            return NotFound(new { message = "Работа не найдена." });
        }

        return Ok(MapArtworkToDto(artwork));
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("admin/all")]
    public async Task<ActionResult<IEnumerable<ArtworkResponseDto>>> GetAllForAdmin()
    {
        var artworks = await _dbContext.Artworks
            .Include(a => a.Author)
            .Include(a => a.Exhibition)
            .Include(a => a.ArtworkTags)
                .ThenInclude(at => at.Tag)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();

        return Ok(artworks.Select(MapArtworkToDto).ToList());
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("{id:guid}/hide")]
    public async Task<IActionResult> Hide(Guid id)
    {
        var artwork = await _dbContext.Artworks.FirstOrDefaultAsync(a => a.Id == id);
        if (artwork is null)
        {
            return NotFound(new { message = "Работа не найдена." });
        }

        artwork.IsHidden = true;
        await _dbContext.SaveChangesAsync();

        return Ok(new { message = "Работа скрыта." });
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("{id:guid}/show")]
    public async Task<IActionResult> Show(Guid id)
    {
        var artwork = await _dbContext.Artworks.FirstOrDefaultAsync(a => a.Id == id);
        if (artwork is null)
        {
            return NotFound(new { message = "Работа не найдена." });
        }

        artwork.IsHidden = false;
        await _dbContext.SaveChangesAsync();

        return Ok(new { message = "Работа снова отображается в галерее." });
    }

    private static ArtworkResponseDto MapArtworkToDto(Artwork artwork)
    {
        return new ArtworkResponseDto
        {
            Id = artwork.Id,
            Title = artwork.Title,
            Description = artwork.Description,
            Year = artwork.Year,
            ImageUrl = artwork.ImageUrl,
            AuthorId = artwork.AuthorId,
            AuthorName = artwork.Author?.Name ?? string.Empty,
            AuthorEmail = artwork.Author?.Email ?? string.Empty,
            ExhibitionId = artwork.ExhibitionId,
            ExhibitionTitle = artwork.Exhibition?.Title ?? string.Empty,
            ExhibitionTheme = artwork.Exhibition?.Theme ?? string.Empty,
            IsHidden = artwork.IsHidden,
            CreatedAt = artwork.CreatedAt,
            Tags = artwork.ArtworkTags
                .Where(at => at.Tag != null)
                .Select(at => at.Tag!.Name)
                .ToList()
        };
    }
}