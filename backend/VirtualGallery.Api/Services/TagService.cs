using Microsoft.EntityFrameworkCore;
using VirtualGallery.Api.Data;
using VirtualGallery.Api.Models;

namespace VirtualGallery.Api.Services;

public class TagService : ITagService
{
    private readonly ApplicationDbContext _dbContext;

    public TagService(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<Tag>> GetOrCreateTagsAsync(IEnumerable<string> tagNames)
    {
        var normalizedTags = tagNames
            .Where(t => !string.IsNullOrWhiteSpace(t))
            .Select(t => t.Trim().ToLowerInvariant())
            .Distinct()
            .ToList();

        if (normalizedTags.Count == 0)
        {
            return new List<Tag>();
        }

        var existingTags = await _dbContext.Tags
            .Where(t => normalizedTags.Contains(t.Name))
            .ToListAsync();

        var existingNames = existingTags
            .Select(t => t.Name)
            .ToHashSet();

        var newTags = normalizedTags
            .Where(name => !existingNames.Contains(name))
            .Select(name => new Tag { Name = name })
            .ToList();

        if (newTags.Count > 0)
        {
            _dbContext.Tags.AddRange(newTags);
            await _dbContext.SaveChangesAsync();
        }

        return existingTags.Concat(newTags).ToList();
    }
}