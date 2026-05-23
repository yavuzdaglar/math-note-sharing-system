namespace Entities;

public class CourseCategory
{
    public int Id { get; set; }
    
    // Örn: "Cebir Dersleri", "Analiz Dersleri"
    public string Name { get; set; } = string.Empty;

    // Bire-Çok İlişki (One-to-Many): Bir ders türünün (kategorinin) içinde birden çok alt ders olabilir.
    public ICollection<Course> Courses { get; set; } = new List<Course>();
}
