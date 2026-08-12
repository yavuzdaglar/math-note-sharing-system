# 📐📊 MathNoteHub

> **A Premium Math Note Sharing Platform** · Premium Matematik Not Paylaşım Platformu

Create, organize, and share rich math notes with the world. MathNoteHub makes writing and sharing mathematics **enjoyable** with its powerful block-based editor, rich media support, and academic hierarchy. ✨

![Status](https://img.shields.io/badge/status-stable-brightgreen) ![.NET](https://img.shields.io/badge/.NET-10.0-512BD4) ![License](https://img.shields.io/badge/license-MIT-blue) ![MVC](https://img.shields.io/badge/UI-MVC-E34F26)

---

## 🧭 Table of Contents

- [🚀 Introduction](#-introduction)
- [✨ Key Features](#-key-features)
- [🧱 Block-Based Editor](#-block-based-editor)
- [🎨 Rich Text Formatting](#-rich-text-formatting)
- [🎬 Media Support](#-media-support)
- [🖼️ GIF Support](#️-gif-support)
- [🧩 Academic Hierarchy](#-academic-hierarchy)
- [🔐 Admin Panel](#-admin-panel)
- [📦 Portable Media](#-portable-media)
- [💻 Technology Stack](#-technology-stack)
- [🏗️ Architecture](#️-architecture)
- [🚀 Setup](#-setup)
- [📜 Version History](#-version-history)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## 🚀 Introduction

**MathNoteHub** is a modern note-sharing platform designed for math enthusiasts, students, and teachers. Users build their notes **block by block**, combining text, images, videos, code, quotes, lists, GIFs, and more — all inside a single note.

With a glassmorphism-inspired interface, **dark mode** support, and smooth animations, it appeals to both technology lovers and mathematics enthusiasts alike. 🌟

```
┌─────────────────────────────────────────────┐
│  ✍️ Write math   🧠 Edit   🌍 Share           │
│      Notes are limitless with MathNoteHub      │
└─────────────────────────────────────────────┘
```

---

## ✨ Key Features

| 🏷️ Feature | 📝 Description |
|---|---|
| 🧱 **Block-Based Editor** | Heading, paragraph, image, video, code, quote, list, subheading, grid, and GIF blocks |
| 🎬 **Media Support** | Upload from local storage or embed from the internet (YouTube) |
| 🎨 **Rich Formatting** | Bold, italic, colored text, and inline **LaTeX** (Σ) support |
| ↩️ **Undo / Redo** | Full history support for all editing actions |
| 🌙 **Premium Design** | Dark mode, animations, modern responsive glassmorphism UI |
| 🧩 **Academic Hierarchy** | Organize notes under **Categories** and **Courses** |
| 🎞️ **GIF Player** | GIF blocks with playback speed and display size control |
| 🔐 **Admin Panel** | User and content management with secure authentication |
| 📦 **Portable Media** | Media stored with relative paths for cross-device access |

---

## 🧱 Block-Based Editor

The **heart of MathNoteHub** is its block-based editor. Every note is made of independent, ordered blocks. 🧩

### 📦 Supported Block Types

| Block | Description | Icon |
|---|---|---|
| **Heading** | Large note titles with rich formatting support | 🏷️ |
| **Subheading** | Sub-section titles | 🔖 |
| **Paragraph** | Free-form text blocks | 📝 |
| **List** | Bulleted content | 📋 |
| **Image** | Upload from device or embed internet images | 🖼️ |
| **Video** | YouTube embeds or external videos | 🎬 |
| **Code** | Syntax-highlighted code blocks | 💻 |
| **Quote** | Important notes and quote boxes | 💬 |
| **Grid** | 2×2 matrix and 4-column layouts | 📐 |
| **GIF** | Animated GIFs with adjustable speed | 🎞️ |

### 🛠️ Editor Features

- ➕ Create new blocks via the add-block menu
- 🔄 Reorder blocks with drag & drop
- 🔁 Undo/redo for every block
- 📐 Grid blocks for 2×2 matrix math content
- 🎛️ Block-based, dynamic editing

---

## 🎨 Rich Text Formatting

Every text block includes an advanced formatting toolbar: 🖌️

- 🅱️ **Bold** (`<strong>`)
- 🅸 **Italic** (`<em>`)
- 🔴🔵⚫ **Text Colors** — red, blue, black
- Σ **Inline LaTeX** — render mathematical expressions inside your text
- 🧹 **Clear Formatting**

> 💡 Heading, Subheading, Paragraph, List, and Important Note blocks are full rich-content editors — formatting renders **identically** in the editor, grid previews, and the published view.

---

## 🎬 Media Support

Add rich media to your notes: 📹

- 📤 **Upload from Device** — upload photos, videos, and GIFs directly
- 🌐 **Embed from Internet** — embed YouTube and other external videos
- 🔄 **URL Media Auto-Download** *(versiyon-1.5+)* — media added via URL is automatically downloaded to the server and stored persistently
- 📁 **Relative-Path Storage** — media is stored with relative paths (`/uploads/...`) for portability

---

## 🖼️ GIF Support

GIFs are the most fun way to explain math animations. MathNoteHub delivers a dedicated GIF experience: 🎞️

| Feature | Details |
|---|---|
| 🎥 **GIF Block Type** | Separate block type (`NoteBlockType.Gif = 12`) |
| 🔊 **Playback Speed** | 0.25x – 4x speed control |
| 📏 **Display Size** | Adjustable display size for each GIF |
| 🧩 **gifuct-js Decoder** | Self-hosted — no CDN dependency, works on any network |
| 📦 **Vendored** | Required packages bundled in `UI/wwwroot/js/vendor/` |

---

## 🧩 Academic Hierarchy

Organize your notes in an academic structure: 🎓

```
🧩 Categories
 └── 📚 Courses
      └── 📒 Notes
           └── 🧱 Blocks
```

This hierarchy lets you systematically separate course notes, topics, and details — making it easy to find any content. 🔎

---

## 🔐 Admin Panel

A powerful management interface for platform administrators: 🛡️

- 🔑 **Secure Authentication** — session management via `IAdminAuthService` in a layered architecture
- 🧂 **SHA-256 + Salted Hashing** — admin passwords are securely hashed and stored in the database
- 📋 **User Management** — list, create, delete
- 📝 **Content Management** — manage notes and content
- 🚪 **Hidden Login** — three rapid clicks on the logo opens the admin login modal
- 🔓 *Passwords are never hardcoded in `appsettings.json`*

---

## 📦 Portable Media

Your media files are stored with **relative paths**: 📂

- ✔️ Uploaded files are kept in `/uploads/...` format
- 🌍 No hardcoded API URLs (`https://localhost:PORT`) — all requests use the `API_BASE_URL` constant
- 🔄 Notes render correctly when opened from another device or host
- 💼 The structure is portable — move the project and the media moves with it

---

## 💻 Technology Stack

| Layer | Technology |
|---|---|
| 🖥️ **Backend** | ASP.NET Core 10.0 Web API |
| 🎨 **Frontend** | ASP.NET Core MVC + TailwindCSS + Lucide Icons |
| 🗄️ **Database** | Entity Framework Core + SQL Server |
| 🧱 **Architecture** | Clean Architecture (Entities, Domain, Application, Infrastructure, API, UI) |

---

## 🏗️ Architecture

The project follows **Clean Architecture** principles: 🏰

```
📁 math-note-sharing-system/
 ├── 📂 Api/            → Web API layer (controllers, DTOs)
 ├── 📂 Application/    → Application services & business rules
 ├── 📂 Domain/         → Domain services & interfaces
 ├── 📂 Entities/       → Database entities
 ├── 📂 Infrastructure/ → Repositories & data access
 ├── 📂 UI/             → ASP.NET Core MVC frontend
 └── 📜 README.md       → This file 😉
```

Each layer **separates its responsibilities**, keeping the project scalable, testable, and maintainable. 🧼

---

## 🚀 Setup

### 📋 Prerequisites

- .NET 10 SDK
- SQL Server (or SQL LocalDB)
- Git

### 🛠️ Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yavuzdaglar/math-note-sharing-system.git
   ```

2. **Configure the database connection string:**
   Edit the `ConnectionStrings` section in `appsettings.json`. 🔧

3. **Apply migrations:**
   ```bash
   dotnet ef database update --project Infrastructure --startup-project UI
   ```

4. **Run the application:**
   ```bash
   dotnet run --project UI
   ```

> ✅ You're now ready to start creating notes in your browser! 🚀

---

## 📜 Version History

### 🔹 versiyon-1.5 — URL Media Auto-Download
- 📥 Media added via URL is **automatically downloaded to the server**
- 🗄️ Added `Api/Controllers/MediaController.cs`
- 📦 Persistent and portable media storage

### 🔹 versiyon-1.4 — GIF Block, Rich Text Toolbar & Portable Media
- 🎞️ **GIF block** added (`NoteBlockType.Gif = 12`)
- ⚡ Playback speed (0.25x–4x) and display size controls
- 🧩 gifuct-js decoder self-hosted — no CDN dependency
- 📁 Media stored with relative paths (`/uploads/...`)
- 🖌️ Rich text toolbar for all text blocks
- 📐 2×2 matrix grid button restored
- 🧹 Code cleanup and bug fixes

### 🔹 versiyon-1.3 — Layered Admin & Grid Improvements
- 🔐 Admin authentication migrated to a layered architecture
- 🧂 SHA-256 + salted hashing, stored in the database
- 🚪 Hidden admin login via triple-click on the logo
- 📐 2×2 and 4-column grid layouts with separate data structures
- 🌙 Editor dark mode fixes
- 📏 Layout width increased to 1280px

### 🔹 versiyon-1.2 — Grid, Visual & Code Blocks
- 💬 Paragraph and quote blocks now have box styling (border, padding, background)
- 💻 Code blocks use `whitespace-pre-wrap` and `break-words`
- 📐 2×2 matrix grid layout added
- 🎛️ Grid panel buttons redesigned as visual-only

### 🔹 versiyon-1.1 — Type Normalization
- 🔤 Block type normalization with `getNoteBlockTypeEnumString`
- 🔁 Recursive block normalization in the published view
- 📐 Grid rendering with 2×2 matrix detection

### 🔹 v1.0 — Initial Release
- 🚀 First release with core note creation and sharing infrastructure

---

## 🤝 Contributing

We love contributions! 🧡

1. 🍴 Fork the repository
2. 🌿 Create a feature branch (`git checkout -b feature/whatever`)
3. ✏️ Make your changes
4. 📝 Commit your changes
5. 📤 Push to the branch (`git push origin feature/whatever`)
6. 🔀 Open a pull request

Feel free to open an **issue** for any suggestion, bug report, or feature request. 💬

---

## 📄 License

This project is licensed under the **MIT License**. 📜

Copyright © 2026 yavuzdaglar

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software...

---

<div align="center">

**📐 Math** ✖️ **💻 Technology** ✖️ **✨ Passion**

*MathNoteHub — Bringing mathematics together with the modern world* 🚀

⭐️ If you like this project, don't forget to star it!

</div>