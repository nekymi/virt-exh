using System.ComponentModel.DataAnnotations;

namespace VirtualGallery.Api.DTOs.Submissions;

public class ReviewSubmissionRequestDto
{
    [Required]
    public bool Approve { get; set; }

    [MaxLength(1000)]
    public string? AdminComment { get; set; }
}