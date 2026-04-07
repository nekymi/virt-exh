using VirtualGallery.Api.Models;

namespace VirtualGallery.Api.Services;

public interface ITagService
{
    Task<List<Tag>> GetOrCreateTagsAsync(IEnumerable<string> tagNames);
}