namespace VirtualGallery.Api.DTOs.Artworks;

public class ArtworkResponseDto
{
    public Guid Id { get; set; }

    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int Year { get; set; }
    public string ImageUrl { get; set; } = string.Empty;

    public Guid AuthorId { get; set; }
    public string AuthorName { get; set; } = string.Empty;
    public string AuthorEmail { get; set; } = string.Empty;

    public Guid ExhibitionId { get; set; }
    public string ExhibitionTitle { get; set; } = string.Empty;
    public string ExhibitionTheme { get; set; } = string.Empty;

    public bool IsHidden { get; set; }
    public DateTime CreatedAt { get; set; }

    public List<string> Tags { get; set; } = new();
}