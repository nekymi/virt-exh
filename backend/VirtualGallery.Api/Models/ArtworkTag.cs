namespace VirtualGallery.Api.Models;

public class ArtworkTag
{
    public Guid ArtworkId { get; set; }
    public Artwork? Artwork { get; set; }

    public Guid TagId { get; set; }
    public Tag? Tag { get; set; }
}