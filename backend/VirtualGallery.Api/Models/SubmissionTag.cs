namespace VirtualGallery.Api.Models;

public class SubmissionTag
{
    public Guid SubmissionId { get; set; }
    public Submission? Submission { get; set; }

    public Guid TagId { get; set; }
    public Tag? Tag { get; set; }
}