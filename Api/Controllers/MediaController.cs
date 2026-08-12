using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("api/media")]
public class MediaController : ControllerBase
{
    private readonly IWebHostEnvironment _environment;
    private static readonly HttpClient Http = new()
    {
        Timeout = TimeSpan.FromSeconds(40)
    };

    private static readonly Dictionary<string, string> ContentTypeExtensions = new()
    {
        ["image/jpeg"] = ".jpg",
        ["image/png"] = ".png",
        ["image/gif"] = ".gif",
        ["image/webp"] = ".webp",
        ["video/mp4"] = ".mp4",
        ["video/webm"] = ".webm",
        ["video/ogg"] = ".ogg",
        ["video/quicktime"] = ".mov"
    };

    private const long MaxDownloadBytes = 100L * 1024 * 1024;

    public MediaController(IWebHostEnvironment environment)
    {
        _environment = environment;
    }

    [HttpPost("upload")]
    public async Task<IActionResult> Upload(IFormFile file)
    {
        if (file == null || file.Length == 0) return BadRequest("Dosya secilmedi.");

        var root = _environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
        if (!Directory.Exists(root)) Directory.CreateDirectory(root);

        var uploads = Path.Combine(root, "uploads");
        if (!Directory.Exists(uploads)) Directory.CreateDirectory(uploads);

        var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
        var filePath = Path.Combine(uploads, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var url = $"/uploads/{fileName}";
        return Ok(new { url });
    }

    [HttpPost("from-url")]
    public async Task<IActionResult> UploadFromUrl([FromBody] MediaFromUrlRequest request)
    {
        var url = request?.Url?.Trim() ?? "";
        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri) ||
            (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
        {
            return BadRequest("Gecersiz URL.");
        }

        var httpRequest = new HttpRequestMessage(HttpMethod.Get, uri);
        httpRequest.Headers.TryAddWithoutValidation("User-Agent", "Mozilla/5.0 (compatible; MathNoteHub/1.0)");

        HttpResponseMessage response;
        try
        {
            response = await Http.SendAsync(httpRequest, HttpCompletionOption.ResponseHeadersRead);
        }
        catch (Exception)
        {
            return BadRequest("Kaynak sunucuya ulasilamadi.");
        }

        using (response)
        {
            if (!response.IsSuccessStatusCode) return BadRequest("Indirme basarisiz.");
            var contentType = response.Content.Headers.ContentType?.MediaType?.ToLowerInvariant() ?? "";
            if (!ContentTypeExtensions.ContainsKey(contentType))
            {
                return BadRequest($"Desteklenmeyen icerik turu: {contentType}");
            }

            var expectedBytes = response.Content.Headers.ContentLength ?? 0;
            if (expectedBytes > MaxDownloadBytes) return BadRequest("Dosya cok buyuk.");

            var root = _environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
            if (!Directory.Exists(root)) Directory.CreateDirectory(root);

            var uploads = Path.Combine(root, "uploads");
            if (!Directory.Exists(uploads)) Directory.CreateDirectory(uploads);

            var fileName = $"{Guid.NewGuid()}{ContentTypeExtensions[contentType]}";
            var filePath = Path.Combine(uploads, fileName);

            await using (var output = new FileStream(filePath, FileMode.Create))
            {
                await using var input = await response.Content.ReadAsStreamAsync();
                var buffer = new byte[81920];
                long total = 0;
                int read;
                while ((read = await input.ReadAsync(buffer)) > 0)
                {
                    total += read;
                    if (total > MaxDownloadBytes)
                    {
                        await output.DisposeAsync();
                        System.IO.File.Delete(filePath);
                        return BadRequest("Dosya cok buyuk.");
                    }
                    await output.WriteAsync(buffer.AsMemory(0, read));
                }
            }

            return Ok(new { url = $"/uploads/{fileName}" });
        }
    }
}

public class MediaFromUrlRequest
{
    public string? Url { get; set; }
}
