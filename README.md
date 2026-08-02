# MathNoteHub

A premium Math Note Sharing System built with ASP.NET Core Web API and a modern glassmorphism-inspired UI.

## Technology Stack

- **Backend**: ASP.NET Core 10.0 Web API
- **Frontend**: ASP.NET Core MVC with TailwindCSS & Lucide Icons
- **Database**: Entity Framework Core with SQL Server
- **Architecture**: Clean Architecture (Entities, Domain, Application, Infrastructure, API, UI)

---

## Version History

### versiyon-1.4
- GIF block added
  - New `Gif` block type (NoteBlockType.Gif = 12) with editor and public view rendering
  - URL entry and server upload options; animated GIFs are decoded and drawn on canvas
  - Play speed (0.25x–4x) and display size controls for each GIF
- gifuct-js decoder self-hosted
  - gifuct-js and its dependencies vendored into `UI/wwwroot/js/vendor/`
  - No more CDN dependency — GIF rendering works on any network
- Portable media URLs
  - Uploaded files (GIF, image, video) now stored as relative paths (`/uploads/...`)
  - Hardcoded `https://localhost:7078` API URLs removed from frontend scripts; all fetches use `API_BASE_URL`
  - Notes now render correctly when opened from another host or device
- Rich text formatting toolbar for all text blocks
  - Heading, Subheading, Paragraph, List, and ImportantNote blocks have: bold, italic, red/blue/black text color, clear formatting, and inline LaTeX (Σ)
  - Headings and Subheadings converted from plain textareas to rich content editors
  - Formatting renders correctly in the editor, grid previews, and the published view
- 2×2 matrix grid button restored in the grid layout panel
- Light theme block borders restored (`#e2e8f0` border on block wrappers)
- Code cleanup
  - Removed unused `AddBlocksAsync`, `IsValidUrl`, `Note.ParentId`/`Parent`/`ChildNotes`, `AccountController.Logout`, and navbar `IsAdmin` property
  - Fixed a stray brace in `NavbarViewComponent` that broke compilation
- Upload fixes
  - Image/Video upload no longer crashes with a `BASE` reference error
  - Fixed stale session handling that redirected users back to home page

### versiyon-1.3
- Admin authentication system migrated to layered architecture
  - `Admin` entity with SHA256 + salted password hashing, stored in database
  - `IAdminService`, `IAdminAuthService`, `AdminService`, `AdminAuthService` in Application layer
  - `IAdminRepository`, `AdminRepository` in Domain/Infrastructure layers
  - `AdminAuthController` (login) and `AdminManagementController` (CRUD) in API layer
  - Admin credentials removed from `appsettings.json` — no hardcoded passwords
  - UI `AccountController` now calls the API instead of using inline checks
  - Admin panel tab added for admin user management (list, create, delete)
- Admin login replaced with triple-click on the navbar logo
  - Visible "Admin Giriş" and "Yönetim Paneli" buttons removed from navbar
  - Three rapid clicks on the logo opens the admin login modal
- Grid block improvements
  - 2×2 matrix layout and 4-column layout now use different data (`layout` property)
  - Both layouts render correctly as separate grid types
- Dark mode fixes in the editor
  - Editor background changed from white to dark (`#0f172a`) in dark mode
  - All text colors (headings, paragraphs, inputs, buttons) use light colors (`#e2e8f0`)
  - Grid columns, important notes, and hover states styled for dark backgrounds
- Paragraph text wrapping fixed inside grid columns
  - `overflow-wrap: break-word` and `word-break: break-word` added
- Layout width increased to 1280px for both editor and published view
- Back button in Admin panel now navigates to homepage (`/`) instead of `history.back()`
- Architecture cleanup
  - Removed unused `Infrastructure` project reference from `UI.csproj`
  - Removed empty directories: `UI/Mapping/`, `UI/DTOs/`, `Domain/Services/`, `Api/Models/`, `Application/Mapping/`

### versiyon-1.2
- Paragraph and Quote blocks in published view now have box styling (border, padding, background)
- Code blocks use `whitespace-pre-wrap` and `break-words` instead of horizontal scroll
- Back button in editor changed from `history.back()` to direct `/Admin` redirect
- Grid panel buttons redesigned as visual-only (number labels removed)
- 2×2 matrix grid layout added (uses `columns: [1,1,1,1]` with 4 column blocks)
- Grid column rendering iterates over `colBlocks` instead of `cols`
- Grid CSS spacing reduced (padding, gap, border-radius)
- Grid removed from sidebar and `+` button add menu
- Grid shapes made draggable with custom drag handlers
- Template includes a Grid block with sample content
- Cache-busting version bumps for JS/CSS assets

### versiyon-1.1
- Block editor type normalization with `getNoteBlockTypeEnumString`
- Published view recursive block normalization for all types including Grid sub-blocks
- Grid rendering with matrix detection for 2×2 layouts

## Features

- **Block-based Editor**: Powerful editor with Heading, Paragraph, Image, Video, Code, Quote, List, Subheading, Grid, and GIF blocks.
- **Media Support**: Upload photos, videos, and GIFs from local storage or embed from the internet (YouTube).
- **Rich Text Formatting**: Bold, italic, text color, and inline LaTeX on all text blocks.
- **Undo/Redo**: Full history support for all editing actions.
- **Premium Design**: Dark mode support, smooth animations, and a sleek responsive interface.
- **Academic Hierarchy**: Organize notes by Categories and Courses.
