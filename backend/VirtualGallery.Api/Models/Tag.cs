using System.ComponentModel.DataAnnotations;

namespace VirtualGallery.Api.Models;

public class Tag
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    public ICollection<SubmissionTag> SubmissionTags { get; set; } = new List<SubmissionTag>();
    public ICollection<ArtworkTag> ArtworkTags { get; set; } = new List<ArtworkTag>();
}