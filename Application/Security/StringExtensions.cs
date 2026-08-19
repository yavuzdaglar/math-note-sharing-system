namespace Application.StringExtensions;

public static class StringExtensions
{
    /// <summary>
    /// Bos olmayan ve [min, max] karakter araliginda olan string'ler icin true doner.
    /// </summary>
    public static bool CleanLengthOk(this string? value, int min, int max)
    {
        if (string.IsNullOrWhiteSpace(value)) return false;
        return value.Length >= min && value.Length <= max;
    }
}
