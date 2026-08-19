using System.Net;
using System.Net.Http.Headers;
using System.Text.RegularExpressions;
using Api.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("api/media")]
[Authorize(Roles = "Admin")]
public class MediaController : ControllerBase
{
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".gif", ".webp",
        ".mp4", ".webm", ".ogg", ".mov"
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

    private const long MaxUploadBytes = 15L * 1024 * 1024;
    private const long MaxDownloadBytes = 50L * 1024 * 1024;
    private const int MaxRedirectHops = 2;

    private readonly IWebHostEnvironment _environment;

    // Redirect'ler manuel olarak dogrulanip takip edilir; SSRF atlatmasi engellenir.
    private static readonly HttpClient Http = new(new SocketsHttpHandler
    {
        AllowAutoRedirect = false,
        ConnectTimeout = TimeSpan.FromSeconds(10),
        AutomaticDecompression = System.Net.DecompressionMethods.All
    })
    {
        Timeout = TimeSpan.FromSeconds(30)
    };

    public MediaController(IWebHostEnvironment environment)
    {
        _environment = environment;
    }

    [HttpPost("upload")]
    [RequestSizeLimit(MaxUploadBytes)]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Upload(IFormFile file)
    {
        if (file == null || file.Length == 0) return BadRequest("Dosya secilmedi.");

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(extension))
        {
            return BadRequest($"Desteklenmeyen dosya turu: {extension}");
        }

        var uploads = GetUploadsDirectory();
        var fileName = $"{Guid.NewGuid():N}{extension}";
        var filePath = Path.Combine(uploads, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        // Icerigi dogrula (magic bytes); gecersizse dosyayi sil
        if (!HasValidSignature(filePath, extension))
        {
            System.IO.File.Delete(filePath);
            return BadRequest("Dosya icerigi gecersiz (bozuk veya uyumsuz format).");
        }

        var url = $"/uploads/{fileName}";
        return Ok(new { url });
    }

    [HttpPost("from-url")]
    [Consumes("application/json")]
    public async Task<IActionResult> UploadFromUrl([FromBody] MediaFromUrlRequest request)
    {
        var rawUrl = request?.Url?.Trim() ?? "";

        if (!SafeUrl.TryCreatePublicHttpUri(rawUrl, out var initialUri))
        {
            return BadRequest("Gecersiz URL.");
        }

        var currentUri = initialUri!;
        HttpResponseMessage response;

        for (var hop = 0; ; hop++)
        {
            var httpRequest = new HttpRequestMessage(HttpMethod.Get, currentUri);
            httpRequest.Headers.TryAddWithoutValidation("User-Agent", "Mozilla/5.0 (compatible; MathNoteHub/1.0)");
            httpRequest.Headers.Accept.ParseAdd("*/*");

            try
            {
                response = await Http.SendAsync(httpRequest, HttpCompletionOption.ResponseHeadersRead, CancellationToken.None);
            }
            catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or System.IO.IOException)
            {
                return BadRequest("Kaynak sunucuya ulasilamadi.");
            }

            if (IsRedirectStatus(response.StatusCode))
            {
                var location = response.Headers.Location;
                response.Dispose();

                if (hop >= MaxRedirectHops) return BadRequest("Cok fazla yonlendirme.");
                if (location == null) return BadRequest("Gecersiz yonlendirme.");

                if (!location.IsAbsoluteUri) location = new Uri(currentUri, location);
                if (!SafeUrl.TryCreatePublicHttpUri(location.AbsoluteUri, out var nextUri) || nextUri == null)
                {
                    return BadRequest("Guvenli olmayan yonlendirme.");
                }

                currentUri = nextUri;
                continue;
            }

            break;
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

            var uploads = GetUploadsDirectory();
            var fileName = $"{Guid.NewGuid():N}{ContentTypeExtensions[contentType]}";
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

            if (!HasValidSignature(filePath, ContentTypeExtensions[contentType]))
            {
                System.IO.File.Delete(filePath);
                return BadRequest("Indirilen icerik gecersiz (bozuk veya uyumsuz format).");
            }

            return Ok(new { url = $"/uploads/{fileName}" });
        }
    }

    private static bool IsRedirectStatus(HttpStatusCode status)
    {
        return status is HttpStatusCode.MovedPermanently or HttpStatusCode.Found
            or HttpStatusCode.SeeOther or HttpStatusCode.TemporaryRedirect
            or HttpStatusCode.PermanentRedirect;
    }

    private string GetUploadsDirectory()
    {
        var root = _environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
        var uploads = Path.Combine(root, "uploads");
        Directory.CreateDirectory(uploads);
        return uploads;
    }

    /// <summary>
    /// Dosyanin gercekten beklenen format oldugunu imza (magic bytes) ile dogrular.
    /// </summary>
    internal static bool HasValidSignature(string filePath, string extension)
    {
        try
        {
            using var fs = new FileStream(filePath, FileMode.Open, FileAccess.Read);
            if (fs.Length < 12) return false;

            var header = new byte[12];
            var read = 0;
            while (read < header.Length)
            {
                var n = fs.Read(header, read, header.Length - read);
                if (n == 0) break;
                read += n;
            }
            if (read < 12) return false;

            return extension.ToLowerInvariant() switch
            {
                ".jpg" or ".jpeg" => header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF,
                ".png" => header[0] == 0x89 && header[1] == 0x50 && header[2] == 0x4E && header[3] == 0x47
                          && header[4] == 0x0D && header[5] == 0x0A && header[6] == 0x1A && header[7] == 0x0A,
                ".gif" => header[0] == 0x47 && header[1] == 0x49 && header[2] == 0x46 && header[3] == 0x38,
                ".webp" => header[0] == 0x52 && header[1] == 0x49 && header[2] == 0x46 && header[3] == 0x46
                           && header[8] == 0x57 && header[9] == 0x45 && header[10] == 0x42 && header[11] == 0x50,
                ".mp4" or ".mov" => header[4] == 0x66 && header[5] == 0x74 && header[6] == 0x79 && header[7] == 0x70,
                ".webm" => header[0] == 0x1A && header[1] == 0x45 && header[2] == 0xDF && header[3] == 0xA3,
                ".ogg" => header[0] == 0x4F && header[1] == 0x67 && header[2] == 0x67 && header[3] == 0x53,
                _ => false
            };
        }
        catch (IOException)
        {
            return false;
        }
    }
}

public class MediaFromUrlRequest
{
    public string? Url { get; set; }
}
