<div align="center">

# 📸 Google Photos Clone

**A full-featured Google Photos clone with AI-powered photo analysis, semantic search, and a premium animated UI**

Built with **Spring Boot 4.1** · **Next.js 16** · **Google Gemini AI** · **TypeScript** · **Tailwind CSS**

[Features](#-features) · [Screenshots](#-screenshots) · [Tech Stack](#-tech-stack) · [Getting Started](#-getting-started) · [Architecture](#-architecture) · [API Reference](#-api-reference)

<img src="screenshots/hero-light.jpg" alt="Photo library in light mode" width="49%"> <img src="screenshots/hero-dark.jpg" alt="Photo library in dark mode" width="49%">

</div>

---

## ✨ Features

### 🤖 AI-Powered (Google Gemini)
- **Auto-Tagging** — Every uploaded photo is analyzed in the background: a one-sentence caption, up to 15 tags, a scene type, and dominant colors
- **Semantic Search** — Search by what's *in* the photo, not just the file name: "mountain lake at sunrise" finds the right shots even when the file is `IMG_2847.jpg`
- **AI Search Re-ranking** — Toggle AI Search and descriptive queries (three words or more) are ranked by Gemini for relevance
- **Smart Album Suggestions** — Scene types and tags are grouped into album suggestions (Landscapes, Architecture, Food…) you can accept or dismiss
- **AI Photo Editing** — Describe an edit in plain language ("make it black and white"); Gemini maps it to ImageKit transforms, shows a before/after preview, and saves the result as a **new** photo — the original is never touched
- **Graceful Degradation** — No Gemini key? Every AI surface reports "not configured" and the rest of the app works exactly as before

### 📸 Photo Management
- **Justified Grid Layout** — Row-based layout preserving original aspect ratios, like Google Photos, with three density settings
- **Drag & Drop Upload** — Drop photos anywhere on the page, with per-file progress, a queue panel, and a progress ring on the upload button
- **EXIF Metadata Extraction** — Camera make/model, lens, exposure, ISO and GPS coordinates, shown in the info panel
- **Favorites** — Star photos with a bounce animation and browse them on a dedicated page
- **Albums** — Create, rename, set a cover, add and remove photos
- **Archive & Trash** — Soft-delete workflow with restore, plus permanent deletion
- **Bulk Download** — Select any number of photos: one comes back as the original file, several as a streamed ZIP

### 🔐 Authentication & Security
- **Google OAuth2** — One-click "Continue with Google"
- **JWT with Refresh Tokens** — Server-side rotation, plus a network-resilient refresh that retries at 1s / 3s / 9s on connection loss and only ends the session when the server explicitly rejects the token
- **Password Management** — Change display name or password from settings
- **Privacy-First Sharing** — Public share responses never include GPS coordinates, owner details, or internal IDs

### 🔗 Sharing
- **Public Links** — Shareable URLs for a single photo or a whole album
- **Expiry Options** — 1 day, 7 days, 30 days, or never
- **Link Management** — Review, copy, and revoke every active link from one page

### 🔍 Search & Navigation
- **Advanced Filters** — Date range (with quick presets), AI scene type, dominant color, and tags — all reflected in the URL, so any filtered view is shareable
- **Quick Filter Chips** — One-tap filtering by scene type, favorites, or recently added, with live counts
- **Search Autocomplete** — Recent searches and library tags suggested as you type, with full keyboard support
- **Collapsible Sidebar** — 240px with labels ↔ 64px icon rail with tooltips and count badges, remembered across visits
- **Mobile Bottom Nav** — Five thumb-reachable tabs that slide away as you scroll down and return as you scroll up
- **Breadcrumbs** — A clickable path on every page that goes deeper than the library root
- **Grid Controls** — Compact / Comfortable / Spacious density, and sorting by date taken or date added

### 🎨 Design & Polish
- **Dark Mode** — True dark (#0a0a0a), WCAG AA text contrast, no flash on load
- **Glassmorphism** — Frosted, saturated blur on the sidebar, header, toolbars, and bottom nav, with solid fallbacks where `backdrop-filter` is unsupported
- **Spring Animations** — Framer Motion physics throughout: sidebar collapse, chip selection, toolbar swaps, the sliding nav indicator, and the filter panel
- **Micro-Interactions** — Star bounce, selection pop, odometer counters, a search field that widens on focus, and tiles that spring between densities
- **Performance-Minded Motion** — Only the sidebar animates its width; the content column slides on a transform (with `will-change` set only while moving), so the grid lays out once instead of every frame
- **PWA Ready** — Installable with a web manifest and maskable icons
- **Accessibility** — ARIA roles on every custom control, keyboard navigation, focus rings, and `prefers-reduced-motion` support that makes springs instant
- **Responsive** — Verified at 1440px and 375px, in both themes

---

## 📸 Screenshots

### Photo Library — Justified Grid
Light | Dark
:---: | :---:
![Grid light](screenshots/grid-light.jpg) | ![Grid dark](screenshots/grid-dark.jpg)

### AI-Powered Features
| Feature | Screenshot |
|---|---|
| **AI analysis in the info panel** — caption, clickable tags, scene, colors | ![AI tags and info panel](screenshots/ai-tags-info.jpg) |
| **Semantic search** — "mountain lake at sunrise" matched through Gemini's tags and captions | ![Semantic search results](screenshots/ai-search.jpg) |
| **AI edit** — plain-language instruction → ImageKit transform → before/after | ![AI edit dialog](screenshots/ai-edit-dialog.jpg) |
| **Smart album suggestions** — grouped from scene types and tags | ![Smart album suggestions](screenshots/smart-albums.jpg) |

### Navigation & Search
| Feature | Screenshot |
|---|---|
| **Quick filter chips** (light) | ![Filter chips light](screenshots/filter-chips-light.jpg) |
| **Quick filter chips** (dark) | ![Filter chips dark](screenshots/filter-chips-dark.jpg) |
| **Advanced search panel** — date, scene, color, tags + active filter chips | ![Advanced search panel](screenshots/advanced-search.jpg) |
| **Breadcrumbs** on an album | ![Breadcrumbs](screenshots/breadcrumbs.jpg) |
| **Grid density** and sort controls | ![Grid density](screenshots/grid-density.jpg) |
| **Bulk download** — contextual toolbar for the selection | ![Selection toolbar with download](screenshots/download-zip.jpg) |

### Collapsible Sidebar
Expanded (240px) | Collapsed (64px, with tooltip)
:---: | :---:
![Sidebar expanded](screenshots/sidebar-expanded.jpg) | ![Sidebar collapsed](screenshots/sidebar-collapsed.jpg)

### Mobile
| Library (light) | Library (dark) | Bottom nav | Search autocomplete |
|:---:|:---:|:---:|:---:|
| ![Mobile light](screenshots/mobile-light.jpg) | ![Mobile dark](screenshots/mobile-dark.jpg) | ![Mobile bottom nav](screenshots/mobile-bottom-nav.jpg) | ![Mobile search](screenshots/mobile-search.jpg) |

### More
| Feature | Screenshot |
|---|---|
| Upload queue with per-file progress | ![Upload progress](screenshots/upload-progress.jpg) |
| Albums | ![Albums](screenshots/albums.jpg) |
| Favorites | ![Favorites](screenshots/favorites.jpg) |
| Glassmorphism (dark) | ![Glassmorphism](screenshots/glassmorphism-dark.jpg) |
| Share dialog | ![Share dialog](screenshots/share-dialog.jpg) |
| Public shared photo | ![Shared photo page](screenshots/shared-photo.jpg) |
| Settings (dark) | ![Settings](screenshots/settings-dark.png) |
| Sign in | ![Login](screenshots/login.png) |

---

## 🛠️ Tech Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Spring Boot | 4.1.1 | REST API framework |
| Spring Security | Boot-managed | JWT filter chain + Google OAuth2 login |
| Spring Data JPA | Boot-managed | Database access over Hibernate, with Specifications for filtered queries |
| PostgreSQL | 15+ | Primary database |
| Google Gemini | `gemini-flash-latest` | Image analysis, search re-ranking, edit suggestions |
| ImageKit | — | Image storage, on-the-fly transforms, CDN |
| metadata-extractor | 2.19 | EXIF parsing |
| JJWT | 0.12.6 | JWT signing and parsing |
| Java | 21 | Language level (builds and runs on JDK 21+) |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| Next.js | 16.3 | React framework (App Router, Turbopack) |
| React | 19.2 | UI library |
| TypeScript | 5 | Type safety |
| Tailwind CSS | 4 | Styling |
| shadcn/ui + Base UI | 1.8 | Accessible component primitives |
| Framer Motion | 13.4 | Spring animations, shared layout transitions |
| TanStack Query | 5 | Server state, caching, infinite scroll |
| Sonner | 2 | Toast notifications |
| Lucide + Remix Icon | — | Icons |
| next-themes | 0.4 | Theme switching |

### Infrastructure
| Technology | Purpose |
|---|---|
| Docker Compose | Local PostgreSQL |
| ImageKit CDN | Image delivery and transforms |
| Google Cloud | OAuth2 credentials + Gemini API |

---

## 🏗️ Architecture

```
┌───────────────────────────────────────────────────────────┐
│                   Client — Next.js 16                     │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │ App Router  │  │   TanStack   │  │  Framer Motion  │   │
│  │ (14 routes) │  │    Query     │  │   (animations)  │   │
│  └──────┬──────┘  └──────┬───────┘  └─────────────────┘   │
│         │                │                                │
│  ┌──────┴────────────────┴────────────────────────────┐   │
│  │            API client — lib/api.ts                 │   │
│  │   JWT header · refresh rotation · retry/backoff    │   │
│  └───────────────────────┬────────────────────────────┘   │
└──────────────────────────┼────────────────────────────────┘
                           │ HTTP / JSON
┌──────────────────────────┼────────────────────────────────┐
│                Backend — Spring Boot 4.1                  │
│  ┌─────────────┐  ┌──────────┐  ┌──────────────────────┐  │
│  │ Controllers │  │ Security │  │ Services             │  │
│  │ Photo Album │  │ JWT +    │  │ PhotoService         │  │
│  │ Auth  AI    │  │ OAuth2   │  │ PhotoSearchService   │  │
│  │ SharedLink  │  │          │  │ GeminiService        │  │
│  │ Library     │  │          │  │ AlbumSuggestionEngine│  │
│  └──────┬──────┘  └──────────┘  │ ImageEditMapper      │  │
│         │                       │ MetadataExtraction   │  │
│         │                       │ PhotoDownloadService │  │
│         │                       │ ImageKitService      │  │
│         │                       └───────────┬──────────┘  │
│  ┌──────┴────────┐                  ┌───────┴─────────┐   │
│  │  PostgreSQL   │                  │  External APIs  │   │
│  │  JPA /        │                  │  Gemini AI      │   │
│  │  Hibernate    │                  │  ImageKit       │   │
│  │  + Specs      │                  │  Google OAuth2  │   │
│  └───────────────┘                  └─────────────────┘   │
└───────────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites
- **Java 21+** (JDK)
- **Node.js 18+** with npm
- **Docker** (for PostgreSQL) or a local PostgreSQL 15+ instance
- **ImageKit account** ([free tier](https://imagekit.io))
- **Google Cloud project** with OAuth2 credentials
- **Gemini API key** ([free from AI Studio](https://aistudio.google.com/apikey)) — optional; the app runs fine without it

### 1. Clone
```bash
git clone https://github.com/PUNIT-BHARDWAJ/Google-Photos-Clone.git
cd Google-Photos-Clone
```

### 2. Start PostgreSQL
```bash
docker compose up -d
```
Or create the database yourself:
```sql
CREATE DATABASE google_photos_clone;
```

### 3. Configure the backend
Create `backend/backend/application-local.properties` — it is git-ignored and imported automatically:

```properties
# Database (matches docker-compose.yml defaults)
spring.datasource.username=postgres
spring.datasource.password=postgres

# JWT signing key (any long random string, 256 bits or more)
app.jwt.secret=your-secret-key-at-least-256-bits-long

# ImageKit — https://imagekit.io/dashboard
imagekit.public-key=your_public_key
imagekit.private-key=your_private_key
imagekit.url-endpoint=https://ik.imagekit.io/your_id

# Google OAuth2 — Google Cloud Console
spring.security.oauth2.client.registration.google.client-id=your_client_id.apps.googleusercontent.com
spring.security.oauth2.client.registration.google.client-secret=your_client_secret

# Gemini — optional; leave it out and AI features report "not configured"
gemini.api-key=your_gemini_api_key
```

Every value can be supplied as an environment variable instead (`JWT_SECRET`, `IMAGEKIT_PRIVATE_KEY`, `GEMINI_API_KEY`, …).

#### Google OAuth2 setup
1. [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials
2. Create an OAuth 2.0 Client ID (Web application)
3. Authorized redirect URI: `http://localhost:8080/login/oauth2/code/google`
4. Authorized JavaScript origin: `http://localhost:3000`

### 4. Start the backend
```bash
cd backend/backend
./mvnw spring-boot:run
```
The API listens on `http://localhost:8080`.

### 5. Start the frontend
```bash
cd client
npm install
npm run dev
```
The app runs at `http://localhost:3000`.

### 6. (Optional) Turn on AI features
1. Get a free key from [Google AI Studio](https://aistudio.google.com/apikey)
2. Add `gemini.api-key=...` to `application-local.properties`
3. Restart the backend
4. Open **Settings → AI features → Analyze all photos**

Analysis is rate-limited to Gemini's free tier (15 requests/minute, with a pause between photos), runs in the background, and can be cancelled at any time.

---

## 📁 Project Structure

```
Google-Photos-Clone/
├── backend/backend/
│   └── src/main/java/project/backend/
│       ├── config/           # Security, CORS, JWT filter, request logging
│       ├── controllers/      # Photo, Album, Auth, AI, PhotoAi, SharedLink, Library, User
│       ├── domain/           # JPA entities (User, Photo, Album, SharedLink, PhotoMetadata)
│       ├── dto/              # Request/response records
│       ├── exception/        # Custom exceptions + global handler
│       ├── repository/       # Spring Data repositories
│       └── services/
│           ├── PhotoService, AlbumService, AuthService, UserService
│           ├── GeminiService              # API calls, rate limiting, retries
│           ├── GeminiResponseParser       # Strict parsing + error classification
│           ├── PhotoSearchService         # Keyword, filtered and AI-ranked search
│           ├── PhotoSpecifications        # JPA Specifications for filters
│           ├── AlbumSuggestionEngine      # Smart album grouping
│           ├── TagVocabulary              # Generic-tag and spelling normalisation
│           ├── ImageEditMapper            # AI instruction → ImageKit transforms
│           ├── MetadataExtractionService  # EXIF
│           ├── PhotoDownloadService       # Single file or streamed ZIP
│           └── SharedLinkService, JwtService, TokenIssuanceService
│
├── client/
│   ├── app/                  # App Router (14 routes)
│   │   ├── (app)/            # Authenticated: photos, search, albums, favorites,
│   │   │                     #   archive, trash, shared-links, settings
│   │   ├── (auth)/           # Login, register
│   │   └── shared/[token]/   # Public shared photo/album page
│   ├── components/
│   │   ├── layout/           # AppShell, SidebarNav, MobileBottomNav, Breadcrumbs, SearchBar
│   │   ├── photos/           # PhotoGrid, JustifiedGrid, PhotoTile, PhotoViewer, PhotoToolbar
│   │   ├── search/           # AdvancedSearchPanel + active filter chips
│   │   ├── albums/           # Album dialogs and menus
│   │   ├── sharing/          # ShareDialog, CopyLinkButton
│   │   ├── uploads/          # DropOverlay, UploadFab, UploadManagerPanel
│   │   └── ui/               # shadcn/ui primitives
│   ├── hooks/                # Data, selection, grid preferences, stored state
│   └── lib/                  # API client, justified-layout algorithm, filters, formatting
│
├── screenshots/              # README images (2× retina)
├── docker-compose.yml        # PostgreSQL
├── LICENSE                   # MIT
└── README.md
```

---

## 🔑 API Reference

### Authentication
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Register with email + password |
| POST | `/api/auth/login` | — | Log in, receive access + refresh tokens |
| POST | `/api/auth/refresh` | — | Exchange a refresh token (rotated server-side) |
| POST | `/api/auth/logout` | ✅ | Revoke the current refresh token |
| GET | `/api/auth/me` | ✅ | Current user profile |
| GET | `/oauth2/authorization/google` | — | Start the Google OAuth2 flow |

### Photos
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/photos` | ✅ | List photos — paginated, filterable by status, starred, scene, color, tag, date range, and sortable |
| POST | `/api/photos/upload` | ✅ | Upload (multipart); queues AI analysis in the background |
| GET | `/api/photos/search` | ✅ | Search by text and/or filters; `ai=true` asks Gemini to re-rank |
| GET | `/api/photos/facets` | ✅ | Scene types, colors and tags with counts (chips, filters, autocomplete) |
| GET | `/api/photos/{id}` | ✅ | Single photo |
| GET | `/api/photos/{id}/metadata` | ✅ | EXIF metadata |
| PUT | `/api/photos/{id}/star` | ✅ | Toggle favorite |
| POST | `/api/photos/download` | ✅ | Download selected photos (one file, or a ZIP) |
| POST | `/api/photos/archive` · `/trash` · `/restore` · `/delete-permanent` | ✅ | Bulk status changes |
| POST | `/api/photos/{id}/share` | ✅ | Create a public link |

### AI
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/photos/ai/status` | ✅ | Whether AI is configured, and how many photos are analyzed |
| POST | `/api/photos/ai/analyze-all` | ✅ | Analyze every un-analyzed photo in the background |
| POST | `/api/photos/ai/analyze-all/cancel` | ✅ | Cancel a running bulk analysis |
| GET | `/api/photos/ai/top-tags` | ✅ | Most common tags, for search suggestions |
| POST | `/api/photos/{id}/ai/analyze` | ✅ | Analyze a single photo |
| POST | `/api/photos/{id}/ai/suggest-edit` | ✅ | Plain-language instruction → ImageKit operations |
| POST | `/api/photos/{id}/ai/save-edit` | ✅ | Save an edited copy as a new photo |
| POST | `/api/photos/{id}/ai/preview` · `/apply` | ✅ | Preview or apply a generative transform |

### Albums
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/albums` | ✅ | List albums |
| POST | `/api/albums` | ✅ | Create an album |
| PATCH | `/api/albums/{id}` | ✅ | Rename or set the cover |
| DELETE | `/api/albums/{id}` | ✅ | Delete an album |
| GET | `/api/albums/{id}/photos` | ✅ | Photos in an album (paginated) |
| POST | `/api/albums/{id}/photos` | ✅ | Add photos |
| DELETE | `/api/albums/{id}/photos/{photoId}` | ✅ | Remove a photo |
| GET | `/api/albums/suggestions` | ✅ | AI-generated album suggestions |
| POST | `/api/albums/{id}/share` | ✅ | Create a public link |

### Library & user
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/library/storage` | ✅ | Storage usage |
| GET | `/api/library/counts` | ✅ | Photo, favorite, album, link, archive and trash counts |
| GET | `/api/library/imagekit-assets` | ✅ | Existing ImageKit assets available to import |
| POST | `/api/library/import` | ✅ | Import ImageKit assets into the library |
| PUT | `/api/user/profile` | ✅ | Update display name or password |
| GET | `/api/shared-links` | ✅ | List active share links |
| DELETE | `/api/shared-links/{id}` | ✅ | Revoke a link |

### Public — no auth
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/public/photos/{token}` | View a shared photo |
| GET | `/api/public/albums/{token}` | View a shared album |

---

## 🧪 Testing

```bash
# Backend — 68 tests
cd backend/backend
./mvnw test

# Frontend — types, lint, production build
cd client
npx tsc --noEmit
npx eslint . --max-warnings 0
npm run build
```

Every page was also checked in a real browser at 1440px and 375px, in both themes, with reduced motion on and off.

---

## 🎨 Design Decisions

| Decision | Reasoning |
|---|---|
| **Justified grid over CSS masonry** | Masonry reorders photos into columns; a justified layout keeps chronological left-to-right order while filling each row edge to edge at natural aspect ratios. |
| **Spring physics over CSS easing** | Tuned stiffness/damping gives motion a weight that fixed easing curves can't. Indicators use shared layout animation so one element travels between positions instead of two fading. |
| **Glassmorphism on navigation surfaces** | Blurring the photos behind the sidebar, header and bottom bar keeps the library present while chrome stays readable. Solid fallbacks cover browsers without `backdrop-filter`. |
| **Only the sidebar animates its width** | Width changes force layout every frame. The content column instead takes its final width immediately and slides in with a transform, so the 80-photo grid re-measures once — measurably smoother than animating padding. |
| **Async AI analysis** | Uploads return as soon as the file is stored; Gemini runs afterwards, rate-limited to the free tier with retries, so a slow or failing AI call never blocks an upload. |
| **ImageKit for edits** | Black and white, blur, sharpen and crops are URL transforms — instant, free, and reversible. Gemini is only asked which transform matches the request. |
| **Filters live in the URL** | Any filtered or searched view can be bookmarked, shared, or reloaded without losing state. |
| **Refresh that survives a flaky network** | A dropped connection retries at 1s/3s/9s; only an explicit 400/401/403 from the server ends the session, so a backend restart doesn't log everyone out. |
| **Privacy-first sharing** | Public responses are built from a separate DTO that has no GPS, no owner, and no internal IDs — fields can't leak by accident. |

---

## 📄 License

[MIT](LICENSE)

---

## 🙏 Acknowledgments

- [Google Photos](https://photos.google.com) — design inspiration
- [shadcn/ui](https://ui.shadcn.com) and [Base UI](https://base-ui.com) — component primitives
- [ImageKit](https://imagekit.io) — image hosting and transforms
- [Framer Motion](https://motion.dev) — animation library
- [Google Gemini](https://ai.google.dev) — AI image analysis
- [Lorem Picsum](https://picsum.photos) — sample photos

---

<div align="center">

**Built by [Punit Bhardwaj](https://github.com/PUNIT-BHARDWAJ)**

If you found this useful, consider giving it a ⭐

</div>
