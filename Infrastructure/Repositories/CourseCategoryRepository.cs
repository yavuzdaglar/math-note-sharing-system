using Domain.Interfaces;
using Entities;
using Infrastructure.Context;

namespace Infrastructure.Repositories;

public class CourseCategoryRepository : ICourseCategoryRepository
{
    private readonly AppDbContext _context;

    public CourseCategoryRepository(AppDbContext context)
    {
        _context = context;
    }

    public List<CourseCategory> GetAll() => _context.CourseCategories.ToList();

    public CourseCategory? GetById(int id) => _context.CourseCategories.FirstOrDefault(x => x.Id == id);

    public void Add(CourseCategory entity)
    {
        _context.CourseCategories.Add(entity);
        _context.SaveChanges();
    }

    public void Update(CourseCategory entity)
    {
        var item = GetById(entity.Id);
        if (item != null)
        {
            item.Name = entity.Name;
            _context.SaveChanges();
        }
    }

    public void Delete(int id)
    {
        var item = GetById(id);
        if (item != null)
        {
            _context.CourseCategories.Remove(item);
            _context.SaveChanges();
        }
    }
}