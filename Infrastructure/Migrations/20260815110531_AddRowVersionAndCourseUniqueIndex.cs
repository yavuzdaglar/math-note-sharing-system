using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddRowVersionAndCourseUniqueIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Notes_Notes_ParentId",
                table: "Notes");

            migrationBuilder.DropIndex(
                name: "IX_Notes_CourseId",
                table: "Notes");

            migrationBuilder.DropIndex(
                name: "IX_Notes_ParentId",
                table: "Notes");

            migrationBuilder.DropColumn(
                name: "ParentId",
                table: "Notes");

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "Notes",
                type: "rowversion",
                rowVersion: true,
                nullable: false,
                defaultValue: new byte[0]);

            migrationBuilder.CreateIndex(
                name: "IX_Notes_CourseId",
                table: "Notes",
                column: "CourseId",
                unique: true,
                filter: "[CourseId] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Notes_CourseId",
                table: "Notes");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "Notes");

            migrationBuilder.AddColumn<int>(
                name: "ParentId",
                table: "Notes",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Notes_CourseId",
                table: "Notes",
                column: "CourseId");

            migrationBuilder.CreateIndex(
                name: "IX_Notes_ParentId",
                table: "Notes",
                column: "ParentId");

            migrationBuilder.AddForeignKey(
                name: "FK_Notes_Notes_ParentId",
                table: "Notes",
                column: "ParentId",
                principalTable: "Notes",
                principalColumn: "Id");
        }
    }
}
