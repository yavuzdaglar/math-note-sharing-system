using Application.DTOs;
using Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("api/admin/manage")]
public class AdminManagementController : ControllerBase
{
    private readonly IAdminService _adminService;

    public AdminManagementController(IAdminService adminService)
    {
        _adminService = adminService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var admins = await _adminService.GetAllAsync(cancellationToken);
        return Ok(admins);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAdminRequest request, CancellationToken cancellationToken)
    {
        var admin = await _adminService.CreateAsync(request, cancellationToken);
        if (admin == null)
            return BadRequest(new { message = "Kullanıcı adı zaten mevcut veya geçersiz." });
        return Ok(admin);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        await _adminService.DeleteAsync(id, cancellationToken);
        return NoContent();
    }
}
