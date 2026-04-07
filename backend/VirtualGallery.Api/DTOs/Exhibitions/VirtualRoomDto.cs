namespace VirtualGallery.Api.DTOs.Exhibitions;

public class VirtualRoomDto
{
    public Guid ExhibitionId { get; set; }

    public string ExhibitionTitle { get; set; } = string.Empty;
    public string ExhibitionTheme { get; set; } = string.Empty;
    public string ExhibitionDescription { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public int MaxArtworks { get; set; }

    public List<VirtualRoomArtworkDto> Artworks { get; set; } = new();
}