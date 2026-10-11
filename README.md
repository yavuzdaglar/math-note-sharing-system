# 🧮 MathNoteHub — Vurmaz Online Notes

> **The most enjoyable way to share math notes with the world!** ✨ Block-based editor, rich media support and academic hierarchy make writing mathematics fun. 📚

![Status](https://img.shields.io/badge/status-live-brightgreen) ![.NET](https://img.shields.io/badge/.NET-10.0-512BD4) ![Deploy](https://img.shields.io/badge/deploy-Azure_App_Service-0078D4) ![Database](https://img.shields.io/badge/database-Azure_SQL-CC2927) ![License](https://img.shields.io/badge/license-MIT-blue)

🌐 **Live site:** `https://vurmaz-online-notlar-epekfmd3f8gue5bk.centralus-01.azurewebsites.net`

---

## 📑 Table of Contents

- [🌟 Highlights](#-highlights)
- [🧱 Block Editor](#-block-editor)
- [🎬 Media Support](#-media-support)
- [🎓 Academic Hierarchy](#-academic-hierarchy)
- [🛡️ Admin Panel & Security](#️-admin-panel--security)
- [📱 Mobile Ready](#-mobile-ready)
- [🛠️ Tech Stack](#️-tech-stack)
- [🏗️ Architecture (Single Host)](#️-architecture-single-host)
- [⚙️ Local Setup](#️-local-setup)
- [☁️ Deployment](#️-deployment)
- [📡 API Overview](#-api-overview)
- [👨‍💻 Developer](#-developer)

---

## 🌟 Highlights

- 🧱 **13 block types** to freely design your notes
- ➗ Real math formulas with **KaTeX** (`$...$` inline and display blocks)
- 🖼️ Images, videos, GIFs and code blocks
- 🗂️ Category → Course → Note hierarchy
- 🔐 JWT-protected admin panel
- 📱 Smooth on phone, tablet and desktop
- 🌙 Dark / light theme
- 🔍 Zoom controls for a focused study mode

---

## 🧱 Block Editor

Every note is built from independent blocks. Reorder with drag & drop, add new ones in one click! 🧩

| # | Block | What is it for? |
|---|-------|-----------------|
| 1 | 📝 Paragraph | Rich text (bold, italic, colors, LaTeX) |
| 2 | 🔠 Heading | Colored, leveled (H1–H4) section titles |
| 3 | 🔹 Subheading | Dashed sub-titles |
| 4 | ⭐ Important Note | Eye-catching green info box |
| 5 | 🎥 Video | YouTube embed or file upload |
| 6 | 🖼️ Image | URL or file upload + size slider |
| 7 | 🖼️🖼️ Double Image | Two images side by side |
| 8 | 💻 Code | Code box with syntax feel |
| 9 | 💬 Quote | Stylish quote block |
| 10 | 📋 List | Numbered lists with intro text |
| 11 | 🔲 Grid | 2–4 column side-by-side layouts |
| 12 | ➗ Math | LaTeX editor with KaTeX preview |
| 13 | 🎞️ GIF | Animations with speed-controlled player |

Plus: ✨ one-click **template**, draft-save / publish flow, and a course-picker dialog before publishing!

---

## 🎬 Media Support

- 📤 **File upload:** images/videos/GIFs straight to the server (`wwwroot/uploads`)
- 🔗 **Import from URL:** external images are auto-downloaded to the server — your note survives even if the link dies! 💪
- 🛡️ **Security:** extension allowlist + magic-bytes signature check + SSRF protection
- 📏 Resize visuals with the size slider

---

## 🎓 Academic Hierarchy

```
📁 Category (e.g. Algebra Courses)
 └── 📖 Course (e.g. Linear Algebra)
      └── 📝 Note (1 course = 1 published note)
```

Rules: publishing requires a course ✅, a second note cannot be attached to the same course ⛔ (409), drafts are hidden from the homepage 👀.

---

## 🛡️ Admin Panel & Security

- 🔑 PBKDF2-SHA256 (200,000 iterations) password protection + lazy rehash
- 🎫 2-hour JWT (httpOnly session + Bearer header, double layer)
- 🚦 Rate limiting (login 5/min, global 300/min)
- 🧹 HTML whitelist sanitization (XSS shield)
- 🛑 Antiforgery-protected forms, security headers (nosniff, DENY, no-referrer)
- 👥 Admin management: create/delete admins (you can't delete yourself 😉)

---

## 📱 Mobile Ready

- 📲 Sidebar becomes a drawer on phones and closes itself after selection
- 🔠 Titles and texts shrink on small screens, identical on desktop
- 🔲 Grids and double images stack vertically on narrow screens
- 🧭 Fixed bottom bar (footer) without overlapping zoom/editor controls
- 🍔 Single menu button issue fixed — just one menu!

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| 🖥️ Backend + Frontend | ASP.NET Core 10 (single host: API + MVC) |
| 🗄️ ORM | Entity Framework Core (SQL Server) |
| 🎨 UI | Razor Views + Tailwind CSS + vanilla JS |
| 🔢 Math | KaTeX 0.16 |
| ✨ Icons | Lucide |
| 🖼️ GIF decoding | gifuct (canvas player) |
| ☁️ Hosting | Azure App Service (Windows, 32-bit, F1) |
| 🗄️ Production DB | Azure SQL (Serverless, auto-pause) |

---

## 🏗️ Architecture (Single Host)

The separate `UI` and `Api` projects were merged — a single **`Api`** project now serves everything (much easier to publish and maintain 🎉):

```
Api/
├── Controllers/            → REST API (api/notes, api/admin/..., api/media/...)
├── Controllers/Web/        → Pages (Home, Admin, Notes, Account)
├── Views/ + ViewComponents/ + Models/ + Services/ → UI layer
├── wwwroot/                → css/js/logo + uploads
└── Program.cs              → JWT + Session + CORS + RateLimit + routing
Application/                 → Services + DTOs + validation rules
Domain/                      → Repository interfaces + exceptions
Entities/                    → Note, NoteBlock, Course, CourseCategory, Admin
Infrastructure/              → DbContext + Repositories + Migrations
```

Flow: the browser calls the same origin (`/api/...`), no CORS hassle, JS talks with a `Bearer` token. 🔄

---

## ⚙️ Local Setup

Requirements: .NET 10 SDK + SQL Server LocalDB + EF CLI (`dotnet tool install -g dotnet-ef`) 🧰

```powershell
# 1. Create the database
dotnet ef database update --project Infrastructure --startup-project Api

# 2. Run (make Api the startup project, press F5!)
dotnet run --project Api --launch-profile https
```

- Site: `https://localhost:7078` 🏠
- Swagger: `https://localhost:7078/swagger` 🧪
- Local settings live in `Api/appsettings.Development.json` (LocalDB + dev JWT key)
- ⚠️ `Api/appsettings.Production.json` is **git-ignored** (see `.gitignore`) — it holds the Azure password and production JWT key, never share it! 🔒

The first admin account is created directly in SQL (password must be stored in PBKDF2 hash format).

---

## ☁️ Deployment

1. 📦 Build a package (32-bit self-contained — independent of the server's .NET version):
   ```powershell
   dotnet publish Api/Api.csproj -c Release -r win-x86 --self-contained true -o .\publish
   Compress-Archive -Path .\publish\* -DestinationPath .\site.zip -Force
   ```
2. 🚀 Azure App Service → Deployment Center → ZIP Deploy (or Kudu `/api/zipdeploy`)
3. ⏳ First launch can be slow (serverless DB wakes from sleep) — that's normal 😴
4. 🌍 For a custom domain + SSL, scale the plan up to B1 and attach DNS + certificate

Notes:
- On the F1 plan the platform must be **32-bit** (64-bit requires Basic+).
- `wwwroot/uploads` is auto-created on first upload; its files are wiped on redeploy (will move to Blob storage later) 📌.

---

## 📡 API Overview

Public 🙋:
- `GET /api/CourseCategories` · `GET /api/Courses`
- `GET /api/notes?search=&page=&pageSize=` · `GET /api/notes/{id}` · `GET /api/notes/course/{courseId}`

Admin (`Authorization: Bearer <JWT>`) 🔐:
- `GET/POST /api/admin/notes` · `GET/PUT/DELETE /api/admin/notes/{id}`
- `POST /api/admin/notes/{id}/blocks` · `POST .../publish` · `POST .../unpublish`
- `POST /api/admin/auth/login` · `GET/POST /api/admin/manage` · `DELETE /api/admin/manage/{id}`
- `POST /api/media/upload` · `POST /api/media/from-url`
- `POST /api/Courses` · `PUT /api/Courses` · `DELETE /api/Courses/{id}` (same pattern for categories)

All errors return `{ "error": "message" }`. 📨

---

## 👨‍💻 Developer

**Yavuz Dağlar** — 🔗 [github.com/yavuzdaglar](https://github.com/yavuzdaglar)

You can also find it in the footer of the site! 👇

---

_Open source under the MIT License. Stay with math! ➗❤️_
