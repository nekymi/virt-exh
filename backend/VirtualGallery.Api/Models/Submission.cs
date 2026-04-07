using System.ComponentModel.DataAnnotations;
using VirtualGallery.Api.Enums;

namespace VirtualGallery.Api.Models;

public class Submission
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
    public Guid UserId { get; set; }
    public User? User { get; set; }

    [Required]
    public Guid ExhibitionId { get; set; }
    public Exhibition? Exhibition { get; set; }

    [Required]
    public SubmissionStatus Status { get; set; } = SubmissionStatus.Pending;

    [MaxLength(1000)]
    public string? AdminComment { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<SubmissionTag> SubmissionTags { get; set; } = new List<SubmissionTag>();
}