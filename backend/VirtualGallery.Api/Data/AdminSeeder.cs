using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using VirtualGallery.Api.Enums;
using VirtualGallery.Api.Models;

namespace VirtualGallery.Api.Data;

public static class AdminSeeder
{
    public static async Task SeedAsync(IServiceProvider serviceProvider, IConfiguration configuration)
    {
        using var scope = serviceProvider.CreateScope();

        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher<User>>();

        var adminEmail = configuration["AdminSeed:Email"] ?? "admin@virtualgallery.local";
        var adminName = configuration["AdminSeed:Name"] ?? "Administrator";
        var adminPassword = configuration["AdminSeed:Password"] ?? "Admin123!";

        var existingAdmin = await dbContext.Users.FirstOrDefaultAsync(u => u.Email == adminEmail);
        if (existingAdmin is not null)
        {
            return;
        }

        var admin = new User
        {
            Name = adminName,
            Email = adminEmail,
            Role = UserRole.Admin,
            CreatedAt = DateTime.UtcNow
        };

        admin.PasswordHash = passwordHasher.HashPassword(admin, adminPassword);

        dbContext.Users.Add(admin);
        await dbContext.SaveChangesAsync();
    }
}