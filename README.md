# 🧮 MathNoteHub

> **A Premium Math Note Sharing Platform** — Create, organize, and share rich math notes with the world.

Create, organize, and share rich math notes with the world. MathNoteHub makes writing and sharing mathematics **enjoyable** with its powerful block-based editor, rich media support, and academic hierarchy. ✨

![Status](https://img.shields.io/badge/status-stable-brightgreen) ![.NET](https://img.shields.io/badge/.NET-10.0-512BD4) ![License](https://img.shields.io/badge/license-MIT-blue) ![MVC](https://img.shields.io/badge/UI-MVC-E34F26) ![Security](https://img.shields.io/badge/security-hardened-2ea44f)

---

## 📑 Table of Contents

- [✨ Introduction](#-introduction)
- [🌟 Key Features](#-key-features)
- [🧱 Block-Based Editor](#-block-based-editor)
- [✍️ Rich Text Formatting](#-rich-text-formatting)
- [🎬 Media Support](#-media-support)
- [🕹️ GIF Support](#-gif-support)
- [🎓 Academic Hierarchy](#-academic-hierarchy)
- [🛡️ Admin Panel & Security](#-admin-panel--security)
- [💼 Portable Media](#-portable-media)
- [🛠️ Technology Stack](#-technology-stack)
- [🏗️ Architecture](#-architecture)
- [⚙️ Setup](#-setup)
- [📡 API Reference](#-api-reference)
- [📜 Version History](#-version-history)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## ✨ Introduction

**MathNoteHub** is a modern note-sharing platform designed for math enthusiasts, students, and teachers. Users build their notes **block by block**, combining text, images, videos, code, quotes, lists, GIFs, and more — all inside a single note.

With a glassmorphism-inspired interface, **dark mode** support, and smooth animations, it appeals to both technology lovers and mathematics enthusiasts alike. 🚀

```
╔══════════════════════════════════════════╗
║  ✏️ Write math   🧩 Edit   📤 Share       ║
║      Notes are limitless with MathNoteHub ║
╚══════════════════════════════════════════╝
```

---

## 🌟 Key Features

| 🎯 Feature | 📝 Description |
|---|---|
| 🧩 **Block-Based Editor** | 13 block types: heading, paragraph, image, video, code, quote, list, subheading, grid, math, GIF and more |
| 🖼️ **Media Support** | Upload from local storage or import from the internet (YouTube) |
| ✍️ **Rich Formatting** | Bold, italic, colored text, and inline **LaTeX** (KaTeX) support |
| ↩️ **Undo / Redo** | Full history support for all editing actions |
| 💎 **Premium Design** | Dark mode, animations, modern responsive glassmorphism UI |
| 🎓 **Academic Hierarchy** | Organize notes under **Categories** and **Courses** |
| 🕹️ **GIF Player** | GIF blocks with playback speed and display size control |
| 🛡️ **Hardened Security** | JWT auth, PBKDF2 hashing, rate limiting, XSS & SSRF protection, magic-byte media validation *(versiyon-1.6+)* |
| 📦 **Portable Media** | Media stored with relative paths for cross-device access |

---

## 🧱 Block-Based Editor

The **heart of MathNoteHub** is its block-based editor. Every note is made of independent, ordered blocks. 🧩

### 📋 Supported Block Types

| Block | Description | Icon |
|---|---|---|
| **Heading** | Large note titles with rich formatting support | 📰 |
| **Subheading** | Sub-section titles | 🧷 |
| **Paragraph** | Free-form text blocks | 📝 |
| **List** | Bulleted content | 📋 |
| **Image** | Upload from device or embed internet images | 🖼️ |
| **DoubleImage** | Two images side by side | 🖼️🖼️ |
| **Video** | YouTube embeds or external videos | 🎬 |
| **Code** | Code blocks (up to 500 KB) | 💻 |
| **Quote** | Important notes and quote boxes | 💬 |
| **Grid** | Multi-column layouts with **nested blocks** inside each column | 🔲 |
| **Math** | KaTeX-rendered mathematical expressions | ∑ |
| **GIF** | Animated GIFs with adjustable speed | 🕹️ |
| **ImportantNote** | Highlighted "read carefully" boxes | ⚠️ |

### ⚙️ Editor Features

- ➕ Create new blocks via the add-block menu
- 🔀 Reorder blocks with drag & drop or up/down arrows
- ↩️ Undo/redo for every block
- 🔲 Grid columns sized with `fr` units — **no overflow**, compact mode on small screens *(versiyon-1.6+)*
- 🧬 Recursive grid rendering — blocks can live inside grid columns
- 🧹 Block deletion with confirmation dialog

---

## ✍️ Rich Text Formatting

Every text block includes an advanced formatting toolbar: ✨

- **Bold** (`<strong>`)
- *Italic* (`<em>`)
- 🎨 **Text Colors** — red, blue, black
- ∑ **Inline LaTeX** — render mathematical expressions inside your text
- 🧹 **Clear Formatting**

> 📌 Heading, Subheading, Paragraph, List, and Important Note blocks are full rich-content editors — formatting renders **identically** in the editor, grid previews, and the published view.

---

## 🎬 Media Support

Add rich media to your notes: 🎥

- 📤 **Upload from Device** — upload photos, videos, and GIFs directly
- 🔗 **Embed from Internet** — embed YouTube and other external videos
- 📥 **URL Media Auto-Download** *(versiyon-1.5+)* — media added via URL is automatically downloaded to the server and stored persistently
- 🧬 **Magic-Byte Validation** *(versiyon-1.6+)* — every upload's real content signature is verified; spoofed files (e.g. `.exe` renamed to `.png`) are rejected
- 🧭 **SSRF-Protected Imports** *(versiyon-1.6+)* — remote imports only reach public internet addresses; localhost, private networks, and cloud metadata endpoints are blocked
- 📁 **Relative-Path Storage** — media is stored with relative paths (`/uploads/...`) for portability

---

## 🕹️ GIF Support

GIFs are the most fun way to explain math animations. MathNoteHub delivers a dedicated GIF experience: 🎮

| Feature | Details |
|---|---|
| 🧩 **GIF Block Type** | Separate block type (`NoteBlockType.Gif = 12`) |
| ⏩ **Playback Speed** | 0.25x - 4x speed control |
| 📐 **Display Size** | Adjustable display size for each GIF |
| 🧩 **gifuct-js Decoder** | Self-hosted — no CDN dependency, works on any network |
| 📦 **Vendored** | Required packages bundled in `UI/wwwroot/js/vendor/` |

---

## 🎓 Academic Hierarchy

Organize your notes in an academic structure: 🗂️

```
📁 Categories
  └── 📚 Courses
        └── 📄 Notes
              └── 🧩 Blocks
```

This hierarchy lets you systematically separate course notes, topics, and details — making it easy to find any content. 🔍

- 🔎 Full-text search across published notes with pagination
- 🖼️ One published note per course, enforced at the **database level** *(versiyon-1.6+)*

---

## 🛡️ Admin Panel & Security

A powerful management interface for platform administrators: 🔐

- 🔑 **JWT Authentication** *(versiyon-1.6+)* — 2-hour bearer tokens (HMAC-SHA256) with role-based authorization; tampered tokens are rejected with `401`
- 🔒 **PBKDF2 Password Hashing** *(versiyon-1.6+)* — 200,000 iterations with 32-byte salt; legacy SHA-256 hashes are **automatically upgraded** on first successful login
- 🚦 **Rate Limiting** *(versiyon-1.6+)* — login 5 req/min/IP, global 300 req/min/IP; overflow returns `429` with a JSON message
- 🧼 **XSS Protection** *(versiyon-1.6+)* — server-side whitelist HTML sanitizer + client-side DOMPurify; all CDN scripts ship with SRI integrity hashes
- 🧱 **SSRF Protection** *(versiyon-1.6+)* — safe URL parsing (public IPs only, safe ports, max 2 redirects, 50 MB download limit)
- 🛡️ **Security Headers** *(versiyon-1.6+)* — `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, HSTS
- 🍪 **Session Security** *(versiyon-1.6+)* — HttpOnly + SameSite=Strict cookies, 30-min timeout, session-fixation protection, CSRF anti-forgery tokens
- 🗂️ **User Management** — list, create, delete admin accounts
- 📝 **Content Management** — full note/course/category CRUD with publish/unpublish workflow
- 🕶️ **Hidden Login** — three rapid clicks on the logo opens the admin login modal
- 🧩 **Optimistic Concurrency** *(versiyon-1.6+)* — notes use `RowVersion`; double-publishing to the same course returns `409 Conflict`
- 🔇 **Clean Errors** — global exception handler; no stack traces or internal details leak to clients

---

## 💼 Portable Media

Your media files are stored with **relative paths**: 📦

- 📁 Uploaded files are kept in `/uploads/...` format
- 🌐 No hardcoded API URLs (`https://localhost:PORT`) — all requests use the `ApiBaseUrl` configuration
- 🖥️ Notes render correctly when opened from another device or host
- 🚚 The structure is portable — move the project and the media moves with it

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| 🚀 **Backend** | ASP.NET Core 10.0 Web API (REST, JSON) |
| 🎨 **Frontend** | ASP.NET Core MVC + TailwindCSS + Lucide Icons |
| ∑ **Math** | KaTeX 0.16.11 (SRI-protected CDN) |
| 🗄️ **Database** | Entity Framework Core + SQL Server |
| 🏗️ **Architecture** | Clean Architecture (Entities, Domain, Application, Infrastructure, API, UI) |
| 🔐 **Auth** | JWT Bearer + PBKDF2-SHA256 password hashing |

---

## 🏗️ Architecture

The project follows **Clean Architecture** principles: 🏛️

```
📦 math-note-sharing-system/
  ├── 📂 Api/            → Web API layer (controllers, JWT, rate limiting, SSRF guards)
  ├── 📂 Application/    → Application services, business rules, HTML sanitizer
  ├── 📂 Domain/         → Domain interfaces, exceptions
  ├── 📂 Entities/       → Database entities
  ├── 📂 Infrastructure/ → EF Core DbContext, repositories, migrations
  ├── 📂 UI/             → ASP.NET Core MVC frontend (Views, JS, CSS)
  └── 📄 README.md       → This file 🎉
```

Each layer **separates its responsibilities**, keeping the project scalable, testable, and maintainable. 🧱

---

## ⚙️ Setup

### 🔧 Prerequisites

- .NET 10 SDK
- SQL Server (or SQL LocalDB)
- Git

### 🚀 Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yavuzdaglar/math-note-sharing-system.git
   ```

2. **Configure the database connection string and JWT key** (required, the API fails fast if missing): 🔑
   ```bash
   # Windows (PowerShell):
   $env:ConnectionStrings__DefaultConnection = "Server=.;Database=MathNoteHub;Trusted_Connection=True;TrustServerCertificate=True"
   $env:Jwt__Key = "a-very-long-secret-key-at-least-32-characters"

   # Linux / macOS:
   export ConnectionStrings__DefaultConnection="Server=.;Database=MathNoteHub;Trusted_Connection=True;TrustServerCertificate=True"
   export Jwt__Key="a-very-long-secret-key-at-least-32-characters"
   ```

3. **Apply migrations:**
   ```bash
   dotnet ef database update --project Infrastructure --startup-project Api
   ```

4. **Create the first admin account** (migrations do not seed an admin for safety): 🧑‍💼
   ```sql
   INSERT INTO Admins (Username, PasswordHash, Salt, CreatedAtUtc)
   VALUES (
     'admin',
     'pbkdf2$200000$j8rNVVz+waaf7gGw82fZHQF4PTyicbhFM/o/w/Nv7Sg=$LtESeWEPd6cj5zybaDVbNWunVyjYYwmsV2oqrRdyro0=',
     'j8rNVVz+waaf7gGw82fZHQF4PTyicbhFM/o/w/Nv7Sg=',
     SYSUTCDATETIME()
   );
   ```
   > ⚠️ The password for this hash is `TestPass123!` — **change it in production!** New admins can be added via the admin panel afterwards.

5. **Run the application:**
   ```bash
   # API (Swagger available at http://localhost:5138/swagger in Development)
   dotnet run --project Api --launch-profile https

   # UI (in a second terminal)
   dotnet run --project UI
   ```

| App | HTTPS | HTTP |
|---|---|---|
| Api | https://localhost:7078 | http://localhost:5138 |
| UI | https://localhost:7263 | http://localhost:5201 |

> 🎉 You're now ready to start creating notes in your browser!

---

## 📡 API Reference

Swagger is enabled only in **Development** (`/swagger`).

### 🌍 Public

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/notes` | List published notes with `search`, `page`, `pageSize` (clamped 1-50) |
| GET | `/api/notes/{id}` | Note detail (`404` if unpublished) |
| GET | `/api/notes/course/{courseId}` | Published note of a course |
| GET | `/api/CourseCategories` | List categories |
| GET | `/api/Courses` | List courses |

### 🔐 Admin (JWT Bearer, role `Admin`)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/admin/auth/login` | Login — accepts **both JSON and form bodies** *(versiyon-1.6+)* |
| GET | `/api/admin/notes` | List notes (`status`, `search`, paging) |
| POST | `/api/admin/notes` | Create note → `201` |
| PUT | `/api/admin/notes/{id}` | Update note (`409` on conflict) |
| DELETE | `/api/admin/notes/{id}` | Delete note → `204` |
| POST | `/api/admin/notes/{id}/blocks` | Upsert all blocks |
| PUT | `/api/admin/notes/{id}/blocks/{blockId}` | Update a single block |
| DELETE | `/api/admin/notes/{id}/blocks/{blockId}` | Delete a block → `204` |
| PUT | `/api/admin/notes/{id}/blocks/reorder` | Reorder blocks |
| POST | `/api/admin/notes/{id}/publish` / `/unpublish` | Publish / unpublish |
| GET/POST/PUT/DELETE | `/api/CourseCategories` | Category CRUD — POST returns `201 {id, name}` *(versiyon-1.6+)*, DELETE `204` |
| GET/POST/PUT/DELETE | `/api/Courses` | Course CRUD — POST returns `201 {id, name, courseCategoryId}` *(versiyon-1.6+)*, DELETE `204` |
| GET/POST/DELETE | `/api/admin/manage` | List / create / delete admins (DELETE `204`) |
| POST | `/api/media/upload` | Upload media (`multipart/form-data`) → `{ url }` |
| POST | `/api/media/from-url` | Import media from a URL (SSRF-protected) → `{ url }` |

### 📦 Common Responses

- Bad request → `400` + Turkish `{ error }` / `{ message }`
- Unauthorized → `401`, forbidden role → `403`, not found → `404`
- Second publish to the same course → `409 Conflict` (unique index)
- Validation errors → `400` (title 1-200 chars, code ≤ 500 KB, grid ≥ 2 columns, etc.)

---

## 📜 Version History

### 🆕 versiyon-1.6 — Security Hardening, Grid Overflow Fix & API Improvements
- 🔐 **Full security hardening** — JWT authentication, PBKDF2 password hashing (200k iterations, auto-upgrade from legacy SHA-256)
- 🚦 **Rate limiting** — login 5 req/min, global 300 req/min
- 🧼 **XSS protection** — server-side whitelist sanitizer + client-side DOMPurify + SRI-protected CDNs
- 🧱 **SSRF protection** — public-IP-only media imports, safe ports, redirect limits, 50 MB cap
- 🧬 **Magic-byte media validation** — fake/spoofed files rejected
- 📐 **Grid overflow fix** — grid columns use `fr` units; no overflow, compact rendering on small screens
- 🧩 **Concurrency controls** — `RowVersion` optimistic locking + unique course-publish index (`409` on conflict)
- 📡 **API improvements** — POSTs return `201` + id, deletes return `204`, login accepts JSON and form
- 🛡️ **Security headers, CORS whitelist, global exception handler, session-fixation protection**
- 🧪 **Comprehensive testing** — 60+ end-to-end scenarios verified against the running system
- 📖 **Detailed README** — this document 🎉

### 📦 versiyon-1.5 — URL Media Auto-Download
- 📥 Media added via URL is **automatically downloaded to the server**
- 📁 Added `Api/Controllers/MediaController.cs`
- 🚚 Persistent and portable media storage

### 🎮 versiyon-1.4 — GIF Block, Rich Text Toolbar & Portable Media
- 🕹️ **GIF block** added (`NoteBlockType.Gif = 12`)
- ⏩ Playback speed (0.25x-4x) and display size controls
- 🧩 gifuct-js decoder self-hosted — no CDN dependency
- 📁 Media stored with relative paths (`/uploads/...`)
- ✍️ Rich text toolbar for all text blocks
- 🔲 2×2 matrix grid button restored
- 🧹 Code cleanup and bug fixes

### 🏗️ versiyon-1.3 — Layered Admin & Grid Improvements
- 🔐 Admin authentication migrated to a layered architecture
- 🔒 SHA-256 + salted hashing, stored in the database
- 🕶️ Hidden admin login via triple-click on the logo
- 🔲 2×2 and 4-column grid layouts with separate data structures
- 🌙 Editor dark mode fixes
- 📐 Layout width increased to 1280px

### 🔲 versiyon-1.2 — Grid, Visual & Code Blocks
- 📝 Paragraph and quote blocks now have box styling (border, padding, background)
- 💻 Code blocks use `whitespace-pre-wrap` and `break-words`
- 🔲 2×2 matrix grid layout added
- 🎨 Grid panel buttons redesigned as visual-only

### 🔧 versiyon-1.1 — Type Normalization
- 🧩 Block type normalization with `getNoteBlockTypeEnumString`
- 🔁 Recursive block normalization in the published view
- 🔲 Grid rendering with 2×2 matrix detection

### 🚀 v1.0 — Initial Release
- 🎉 First release with core note creation and sharing infrastructure

---

## 🤝 Contributing

We love contributions! 💚

1. 🍴 Fork the repository
2. 🌿 Create a feature branch (`git checkout -b feature/whatever`)
3. ✏️ Make your changes
4. ✅ Commit your changes
5. 📤 Push to the branch (`git push origin feature/whatever`)
6. 🔀 Open a pull request

Feel free to open an **issue** for any suggestion, bug report, or feature request. 🐛

---

## 📄 License

This project is licensed under the **MIT License**. 📜

Copyright © 2026 yavuzdaglar

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software...

---

<div align="center">

**🧮 Math** ✨ **💻 Technology** ❤️ **Passion**

*MathNoteHub — Bringing mathematics together with the modern world* 🚀

⭐ If you like this project, don't forget to star it!

</div>