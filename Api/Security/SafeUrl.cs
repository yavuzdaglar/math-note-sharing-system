using System.Net;
using System.Net.Sockets;

namespace Api.Security;

/// <summary>
/// SSRF korumasi icin gelen URL'leri ve IP adreslerini dogrular.
/// </summary>
public static class SafeUrl
{
    public static bool TryCreatePublicHttpUri(string rawUrl, out Uri? uri)
    {
        uri = null;

        if (string.IsNullOrWhiteSpace(rawUrl)) return false;
        if (!Uri.TryCreate(rawUrl.Trim(), UriKind.Absolute, out var parsed)) return false;

        // Yalnizca http/https
        if (parsed.Scheme != Uri.UriSchemeHttp && parsed.Scheme != Uri.UriSchemeHttps) return false;

        // Kullanici:parola bilgisi yasak (SSRF atlatma vektoru)
        if (!string.IsNullOrEmpty(parsed.UserInfo)) return false;

        // Yalnizca standart portlara izin ver (iç servislerdeki ozel portlari hedefleme engellenir)
        if (parsed.IsDefaultPort) { uri = parsed; return true; }
        if (parsed.Port == 80 || parsed.Port == 443) { uri = parsed; return true; }

        return false;
    }

    /// <summary>
    /// IP adresinin genel (public) agda olup olmadigini kontrol eder.
    /// Private, loopback, link-local, multicast, reserved ve CGNAT aglari reddedilir.
    /// </summary>
    public static bool IsPublicAddress(IPAddress address)
    {
        if (address == null) return false;

        if (address.IsIPv6Multicast || address.IsIPv4MappedToIPv6)
        {
            address = address.IsIPv4MappedToIPv6 ? address.MapToIPv4() : address;
        }

        if (IPAddress.IsLoopback(address)) return false;
        if (address.IsIPv6LinkLocal) return false;
        if (address.IsIPv6SiteLocal) return false;
        if (address.AddressFamily == AddressFamily.InterNetworkV6)
        {
            var v6 = address.GetAddressBytes();
            if ((v6[0] & 0xFF) == 0xFF) return false; // multicast ff00::/8
            return true;
        }

        var bytes = address.GetAddressBytes();

        // IPv4
        if (address.AddressFamily == AddressFamily.InterNetwork)
        {
            uint ip = ((uint)bytes[0] << 24) | ((uint)bytes[1] << 16) | ((uint)bytes[2] << 8) | bytes[3];

            // 0.0.0.0/8
            if (bytes[0] == 0) return false;
            // 10.0.0.0/8
            if (bytes[0] == 10) return false;
            // 100.64.0.0/10 (CGNAT)
            if (bytes[0] == 100 && (bytes[1] & 0xC0) == 0x40) return false;
            // 127.0.0.0/8 loopback
            if (bytes[0] == 127) return false;
            // 169.254.0.0/16 link-local
            if (bytes[0] == 169 && bytes[1] == 254) return false;
            // 172.16.0.0/12
            if (bytes[0] == 172 && bytes[1] >= 16 && bytes[1] <= 31) return false;
            // 192.0.0.0/24 (+ 192.0.0.8/32, 192.0.0.9/32, 192.0.0.10/32) — genel kontrol
            if (bytes[0] == 192 && bytes[1] == 0 && bytes[2] == 0) return false;
            // 192.168.0.0/16
            if (bytes[0] == 192 && bytes[1] == 168) return false;
            // 198.18.0.0/15 benchmark
            if (bytes[0] == 198 && (bytes[1] == 18 || bytes[1] == 19)) return false;
            // 198.51.100.0/24 documentation
            if (bytes[0] == 198 && bytes[1] == 51 && bytes[2] == 100) return false;
            // 203.0.113.0/24 documentation
            if (bytes[0] == 203 && bytes[1] == 0 && bytes[2] == 113) return false;
            // 240.0.0.0/4 reserved + 224.0.0.0/4 multicast
            if (bytes[0] >= 224) return false;
        }

        return true;
    }

    /// <summary>
    /// DNS cozumlemesi yapar; host adi tarafina karsilik gelen TUM adresler
    /// genel agda degilse false doner. Cozumleme basarisizsa false doner.
    /// </summary>
    public static async Task<bool> IsPublicHostAsync(string host, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(host)) return false;

        // IP ile verilmis host
        if (IPAddress.TryParse(host, out var direct))
        {
            return IsPublicAddress(direct);
        }

        try
        {
            var addresses = await Dns.GetHostAddressesAsync(host, cancellationToken);
            if (addresses.Length == 0) return false;

            foreach (var address in addresses)
            {
                if (!IsPublicAddress(address)) return false;
            }

            return true;
        }
        catch (SocketException)
        {
            return false;
        }
    }
}
