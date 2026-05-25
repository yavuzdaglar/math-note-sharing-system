using Domain.Interfaces;
using Entities;
using Infrastructure.Context;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class CourseRepository : ICourseRepository
{
    private readonly AppDbContext _context;

    public CourseRepository(AppDbContext context)
    {
        _context = context;
    }

    public List<Course> GetAll() => _context.Courses.Include(x => x.CourseCategory).ToList();

    public Course? GetById(int id) => _context.Courses.Include(x => x.CourseCategory).FirstOrDefault(x => x.Id == id);

    public void Add(Course entity)
    {
        _context.Courses.Add(entity);
        _context.SaveChanges();
    }

    public void Update(Course entity)
    {
        var item = GetById(entity.Id);
        if (item != null)
        {
            item.Name = entity.Name;
            item.CourseCategoryId = entity.CourseCategoryId;
            _context.SaveChanges();
        }
    }

    public void Delete(int id)
    {
        var item = GetById(id);
        if (item != null)
        {
            var notes = _context.Notes.Where(n => n.CourseId == id).ToList();
            if (notes.Count > 0)
            {
                var now = DateTime.UtcNow;
                foreach (var note in notes)
                {
                    note.CourseId = null;
                    if (note.Status == NoteStatus.Published)
                    {
                        note.Status = NoteStatus.Draft;
                        note.PublishedAtUtc = null;
                    }
                    note.UpdatedAtUtc = now;
                }
            }
            _context.Courses.Remove(item);
            _context.SaveChanges();
        }
    }
}