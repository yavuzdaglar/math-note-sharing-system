using Domain.Interfaces;
using Entities;
using Infrastructure.Context;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class AdminRepository : IAdminRepository
{
    private readonly AppDbContext _context;

    public AdminRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Admin?> GetByUsernameAsync(string username, CancellationToken cancellationToken)
    {
        return await _context.Admins.FirstOrDefaultAsync(a => a.Username == username, cancellationToken);
    }

    public async Task<bool> UsernameExistsAsync(string username, CancellationToken cancellationToken)
    {
        return await _context.Admins.AnyAsync(a => a.Username == username, cancellationToken);
    }

    public async Task AddAsync(Admin admin, CancellationToken cancellationToken)
    {
        await _context.Admins.AddAsync(admin, cancellationToken);
    }

    public async Task DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var admin = await _context.Admins.FindAsync(new object[] { id }, cancellationToken);
        if (admin != null)
        {
            _context.Admins.Remove(admin);
        }
    }

    public async Task<List<Admin>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await _context.Admins.OrderBy(a => a.Id).ToListAsync(cancellationToken);
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        await _context.SaveChangesAsync(cancellationToken);
    }
}
