namespace VirtualGallery.Api.DTOs.Submissions;

public class SubmissionResponseDto
{
    public Guid Id { get; set; }

    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int Year { get; set; }
    public string ImageUrl { get; set; } = string.Empty;

    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;

    public Guid ExhibitionId { get; set; }
    public string ExhibitionTitle { get; set; } = string.Empty;
    public string ExhibitionTheme { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;
    public string? AdminComment { get; set; }

    public DateTime CreatedAt { get; set; }

    public List<string> Tags { get; set; } = new();
}