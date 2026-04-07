using System.ComponentModel.DataAnnotations;

namespace VirtualGallery.Api.DTOs.Submissions;

public class CreateSubmissionRequestDto
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MaxLength(3000)]
    public string Description { get; set; } = string.Empty;

    [Range(1000, 3000)]
    public int Year { get; set; }

    [Required]
    [MaxLength(500)]
    public string ImageUrl { get; set; } = string.Empty;

    [Required]
    public Guid ExhibitionId { get; set; }

    public List<string> Tags { get; set; } = new();
}