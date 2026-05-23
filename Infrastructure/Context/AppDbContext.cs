using Entities;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Context;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Course> Courses => Set<Course>();
    public DbSet<CourseCategory> CourseCategories => Set<CourseCategory>();
    public DbSet<Note> Notes => Set<Note>();
    public DbSet<NoteBlock> NoteBlocks => Set<NoteBlock>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Course>()
            .HasOne(c => c.CourseCategory)
            .WithMany(c => c.Courses)
            .HasForeignKey(c => c.CourseCategoryId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Note>(entity =>
        {
            entity.Property(n => n.Title).HasMaxLength(200).IsRequired();
            entity.Property(n => n.Slug).HasMaxLength(200);
            entity.Property(n => n.Summary).HasMaxLength(500);
            entity.Property(n => n.Status).IsRequired();
            entity.HasIndex(n => n.Slug).IsUnique().HasFilter("[Slug] IS NOT NULL");

            entity.HasMany(n => n.Blocks)
                .WithOne(b => b.Note)
                .HasForeignKey(b => b.NoteId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<NoteBlock>(entity =>
        {
            entity.Property(b => b.Type).IsRequired();
            entity.Property(b => b.ContentJson).IsRequired();
            entity.HasIndex(b => new { b.NoteId, b.Order }).IsUnique();
        });

    }
}
