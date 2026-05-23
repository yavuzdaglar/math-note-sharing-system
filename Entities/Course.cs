namespace Entities;

public class Course
{
    public int Id { get; set; }
    
    // Örn: "Soyut Cebir", "Lineer Cebir"
    public string Name { get; set; } = string.Empty;

    // Foreign Key (Yabancı Anahtar): Hangi ana ders türüne bağlı olduğunu tutar
    public int CourseCategoryId { get; set; }
    
    // Navigation Property: Alt dersin bağlı olduğu üst kategoriye erişmemizi sağlar
    public CourseCategory CourseCategory { get; set; } = null!;
    public ICollection<Note> Notes { get; set; } = new List<Note>();
}
