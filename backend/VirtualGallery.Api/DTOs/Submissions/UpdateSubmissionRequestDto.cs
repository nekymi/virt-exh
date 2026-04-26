using System.ComponentModel.DataAnnotations;

namespace VirtualGallery.Api.DTOs.Submissions;

public class UpdateSubmissionRequestDto
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MaxLength(2000)]
    public string Description { get; set; } = string.Empty;

    [Range(1000, 3000)]
    public int Year { get; set; }

    [Required]
    public string ImageUrl { get; set; } = string.Empty;

    [Required]
    public Guid ExhibitionId { get; set; }

    public List<string> Tags { get; set; } = new();
}