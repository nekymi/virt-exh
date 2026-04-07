namespace VirtualGallery.Api.DTOs.Exhibitions;

public class ExhibitionArtworkItemDto
{
    public Guid Id { get; set; }

    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int Year { get; set; }
    public string ImageUrl { get; set; } = string.Empty;

    public string AuthorName { get; set; } = string.Empty;
    public string AuthorEmail { get; set; } = string.Empty;

    public List<string> Tags { get; set; } = new();
}