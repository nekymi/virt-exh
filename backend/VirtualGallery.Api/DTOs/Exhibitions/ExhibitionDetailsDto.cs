namespace VirtualGallery.Api.DTOs.Exhibitions;

public class ExhibitionDetailsDto
{
    public Guid Id { get; set; }

    public string Title { get; set; } = string.Empty;
    public string Theme { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;

    public DateTime SubmissionStartDate { get; set; }
    public DateTime SubmissionEndDate { get; set; }

    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }

    public DateTime CreatedAt { get; set; }

    public string Status { get; set; } = string.Empty;

    public int ArtworkCount { get; set; }

    public List<ExhibitionArtworkItemDto> Artworks { get; set; } = new();
}