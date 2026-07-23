namespace Application.DTOs;

public class AdminLoginRequest
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class AdminLoginResponse
{
    public bool Success { get; set; }
    public string? Message { get; set; }
    public string? RedirectUrl { get; set; }
}

public class AdminDto
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; }
}

public class CreateAdminRequest
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
