namespace Domain.Exceptions;

/// <summary>
/// Benzersizlik kisiti (unique constraint) ihlal edildiginde firlatilir.
/// </summary>
public class UniqueConstraintViolationException : Exception
{
    public UniqueConstraintViolationException(string message) : base(message) { }
    public UniqueConstraintViolationException(string message, Exception innerException) : base(message, innerException) { }
}
