using System.ComponentModel.DataAnnotations;

namespace VirtualGallery.Api.DTOs.Exhibitions;

public class UpdateExhibitionRequestDto
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string Theme { get; set; } = string.Empty;

    [Required]
    [MaxLength(2000)]
    public string Description { get; set; } = string.Empty;

    [Required]
    public DateTime SubmissionStartDate { get; set; }

    [Required]
    public DateTime SubmissionEndDate { get; set; }

    [Required]
    public DateTime StartDate { get; set; }

    [Required]
    public DateTime EndDate { get; set; }
}