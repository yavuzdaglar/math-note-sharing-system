using Ganss.Xss;

namespace Application.Security;

/// <summary>
/// Zengin metin (rich text) icerikleri icin whitelist tabanli HTML sanitizer.
/// Script, on* ozellikleri, javascript: ve diger tehlikeli icerikleri temizler.
/// </summary>
public static class HtmlSanitizerUtil
{
    private static readonly HtmlSanitizer Sanitizer = CreateSanitizer();

    private static HtmlSanitizer CreateSanitizer()
    {
        var sanitizer = new HtmlSanitizer();

        sanitizer.AllowedTags.Clear();
        sanitizer.AllowedTags.UnionWith(new HashSet<string>
        {
            "p", "br", "div", "span",
            "b", "strong", "i", "em", "u", "s", "strike", "small", "mark", "sub", "sup", "font",
            "ul", "ol", "li",
            "h1", "h2", "h3", "h4", "h5", "h6",
            "blockquote"
        });

        sanitizer.AllowedAttributes.Clear();
        sanitizer.AllowedAttributes.UnionWith(new HashSet<string>
        {
            "style", "class", "color"
        });

        sanitizer.AllowedCssProperties.Clear();
        sanitizer.AllowedCssProperties.UnionWith(new HashSet<string>
        {
            "color", "background-color", "font-weight", "font-style",
            "text-decoration", "text-align", "font-size"
        });

        sanitizer.AllowedSchemes.Clear();
        sanitizer.AllowedSchemes.UnionWith(new HashSet<string> { "http", "https", "mailto" });

        sanitizer.AllowDataAttributes = false;
        sanitizer.KeepChildNodes = true;

        return sanitizer;
    }

    public static string Sanitize(string? html)
    {
        if (string.IsNullOrEmpty(html)) return string.Empty;
        return Sanitizer.Sanitize(html);
    }
}
