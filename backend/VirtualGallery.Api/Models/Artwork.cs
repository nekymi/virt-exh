using System.ComponentModel.DataAnnotations;

namespace VirtualGallery.Api.Models;

public class Artwork
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MaxLength(3000)]
    public string Description { get; set; } = string.Empty;

    public int Year { get; set; }

    [Required]
    [MaxLength(500)]
    public string ImageUrl { get; set; } = string.Empty;

    [Required]
    public Guid AuthorId { get; set; }
    public User? Author { get; set; }

    [Required]
    public Guid ExhibitionId { get; set; }
    public Exhibition? Exhibition { get; set; }

    public bool IsHidden { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<ArtworkTag> ArtworkTags { get; set; } = new List<ArtworkTag>();
}