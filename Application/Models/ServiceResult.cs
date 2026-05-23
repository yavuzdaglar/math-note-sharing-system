namespace Application.Models;

public class ServiceResult<T>
{
    public bool Succeeded { get; }
    public T? Data { get; }
    public string? Error { get; }
    public int StatusCode { get; }

    private ServiceResult(bool succeeded, T? data, string? error, int statusCode)
    {
        Succeeded = succeeded;
        Data = data;
        Error = error;
        StatusCode = statusCode;
    }

    public static ServiceResult<T> Success(T data, int statusCode = 200)
    {
        return new ServiceResult<T>(true, data, null, statusCode);
    }

    public static ServiceResult<T> Fail(string error, int statusCode)
    {
        return new ServiceResult<T>(false, default, error, statusCode);
    }
}
