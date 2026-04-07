using Microsoft.EntityFrameworkCore;
using VirtualGallery.Api.Models;

namespace VirtualGallery.Api.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Exhibition> Exhibitions => Set<Exhibition>();
    public DbSet<Submission> Submissions => Set<Submission>();
    public DbSet<Artwork> Artworks => Set<Artwork>();
    public DbSet<Tag> Tags => Set<Tag>();
    public DbSet<SubmissionTag> SubmissionTags => Set<SubmissionTag>();
    public DbSet<ArtworkTag> ArtworkTags => Set<ArtworkTag>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<Tag>()
            .HasIndex(t => t.Name)
            .IsUnique();

        modelBuilder.Entity<SubmissionTag>()
            .HasKey(st => new { st.SubmissionId, st.TagId });

        modelBuilder.Entity<SubmissionTag>()
            .HasOne(st => st.Submission)
            .WithMany(s => s.SubmissionTags)
            .HasForeignKey(st => st.SubmissionId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<SubmissionTag>()
            .HasOne(st => st.Tag)
            .WithMany(t => t.SubmissionTags)
            .HasForeignKey(st => st.TagId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ArtworkTag>()
            .HasKey(at => new { at.ArtworkId, at.TagId });

        modelBuilder.Entity<ArtworkTag>()
            .HasOne(at => at.Artwork)
            .WithMany(a => a.ArtworkTags)
            .HasForeignKey(at => at.ArtworkId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ArtworkTag>()
            .HasOne(at => at.Tag)
            .WithMany(t => t.ArtworkTags)
            .HasForeignKey(at => at.TagId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Submission>()
            .HasOne(s => s.User)
            .WithMany(u => u.Submissions)
            .HasForeignKey(s => s.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Submission>()
            .HasOne(s => s.Exhibition)
            .WithMany(e => e.Submissions)
            .HasForeignKey(s => s.ExhibitionId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Artwork>()
            .HasOne(a => a.Author)
            .WithMany(u => u.Artworks)
            .HasForeignKey(a => a.AuthorId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Artwork>()
            .HasOne(a => a.Exhibition)
            .WithMany(e => e.Artworks)
            .HasForeignKey(a => a.ExhibitionId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}