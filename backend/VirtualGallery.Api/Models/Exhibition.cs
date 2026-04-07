using System.ComponentModel.DataAnnotations;

namespace VirtualGallery.Api.Models;

public class Exhibition
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string Theme { get; set; } = string.Empty;

    [Required]
    [MaxLength(2000)]
    public string Description { get; set; } = string.Empty;

    public DateTime SubmissionStartDate { get; set; }
    public DateTime SubmissionEndDate { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Submission> Submissions { get; set; } = new List<Submission>();
    public ICollection<Artwork> Artworks { get; set; } = new List<Artwork>();
}