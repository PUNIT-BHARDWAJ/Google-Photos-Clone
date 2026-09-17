# 📸 Google Photos Clone

A full-featured Google Photos clone built with **Spring Boot 4.1** and **Next.js 16**: Google OAuth2 sign-in, EXIF metadata extraction, a justified photo grid, drag-and-drop uploads, public share links, ImageKit-powered AI edits, fluid animations and a WCAG-audited dark mode.

<p align="center">
  <img src="screenshots/hero-light.jpg" alt="Photo library in light mode" width="49%">
  <img src="screenshots/hero-dark.jpg" alt="Photo library in dark mode" width="49%">
</p>

---

## ✨ Features

### Core
- **Photo library**: upload, star, archive, trash, restore and permanently delete, with bulk selection for every action
- **Justified grid**: rows that fill the full width while preserving each photo's aspect ratio, grouped by day, with infinite scroll
- **Albums**: create albums, add or remove photos, and pick a cover photo
- **Search**: case-insensitive search across file names
- **Favorites**: star photos from the grid or the viewer and browse them on their own page

### Authentication & Security
- **Google OAuth2**: one-click "Continue with Google" sign-in that issues the app's own tokens
- **JWT authentication**: short-lived access tokens with rotating refresh tokens
- **Resilient sessions**: a network hiccup during token refresh retries after 1s, 3s and 9s instead of signing you out
- **Account settings**: update your display name and change your password
- **No secrets in the repo**: credentials come from environment variables or a git-ignored local properties file

### Sharing
- **Public links** for photos and albums, viewable without an account
- **Expiry options**: 1, 7 or 30 days, or never
- **Link management**: copy or revoke links from a dedicated page
- **Privacy-safe**: public responses never include GPS coordinates, photo IDs or user details

### Upload & Media
- **Drag and drop** anywhere in the library, or use the upload button
- **Multi-file uploads** with per-file progress, retry and a progress ring on the upload button
- **Validation** by MIME type with a file-extension fallback (JPEG, PNG, GIF, WebP, HEIC/HEIF, BMP, TIFF, SVG; up to 50 MB)
- **EXIF metadata**: camera, lens settings, GPS location and capture date, shown in the viewer's info panel (press **I**)
- **AI edits** via ImageKit: remove or change backgrounds, generative fill, smart and object-aware crops, retouch and upscale, saved as a new copy
- **ImageKit import**: bring existing assets from your ImageKit library into the app

### UI/UX & Polish
- **Dark mode**: a true-black theme with every text pair checked against WCAG AA, a 200ms colour cross-fade on theme changes, and no flash of the wrong theme on load
- **Animations** (Framer Motion): page transitions, staggered tile entrances, gap-closing deletes, a sliding photo viewer, star and selection micro-interactions and blur-up image loading
- **Responsive**: designed for phones through desktops, with swipe navigation in the viewer
- **Accessible**: keyboard navigation, focus management in dialogs, visible focus rings, ARIA labelling and full `prefers-reduced-motion` support
- **Installable**: a web app manifest with app icons

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **Spring Boot 4.1** (Java 21) | REST API |
| **Spring Security** | JWT authentication and Google OAuth2 login |
| **Spring Data JPA / Hibernate** | Persistence |
| **PostgreSQL 16** | Database (Docker Compose for local development) |
| **ImageKit Java SDK** | Image storage, transformations and AI edits |
| **metadata-extractor** | EXIF parsing |
| **JJWT** | Token signing and validation |

### Frontend
| Technology | Purpose |
|---|---|
| **Next.js 16** (App Router) + **React 19** | Application framework |
| **TypeScript** | Type safety |
| **Tailwind CSS 4** | Styling with semantic design tokens |
| **shadcn/ui** on **Base UI** | Accessible UI primitives |
| **TanStack Query** | Server state, caching and optimistic updates |
| **Zustand** | Auth session store |
| **React Hook Form** + **Zod** | Forms and validation |
| **Framer Motion** | Animations |
| **next-themes** | Light, dark and system themes |
| **Sonner** | Toast notifications |
| **Lucide** + **Remix Icon** | Icons |

---

## 📸 Screenshots

### Justified grid
<p align="center">
  <img src="screenshots/grid-light.jpg" alt="Justified grid in light mode" width="49%">
  <img src="screenshots/grid-dark.jpg" alt="Justified grid in dark mode" width="49%">
</p>

### Photo viewer with info panel
![Photo viewer with the info panel open](screenshots/viewer-info.jpg)

### Uploading with progress
![Upload manager panel with per-file progress](screenshots/upload-progress.jpg)

### Sharing
<p align="center">
  <img src="screenshots/share-dialog.jpg" alt="Share dialog with a public link" width="49%">
  <img src="screenshots/shared-photo.jpg" alt="Public shared photo page" width="49%">
</p>

### Favorites, albums and search
<p align="center">
  <img src="screenshots/favorites.jpg" alt="Favorites page" width="49%">
  <img src="screenshots/albums.jpg" alt="Albums page" width="49%">
</p>

![Search results for "mountain"](screenshots/search-results.jpg)

### Settings (dark mode)
![Settings page in dark mode](screenshots/settings-dark.png)

### Mobile
<p align="center">
  <img src="screenshots/mobile-light.jpg" alt="Mobile library in light mode" width="32%">
  <img src="screenshots/mobile-dark.jpg" alt="Mobile library in dark mode" width="32%">
</p>

### Sign in
![Sign-in page](screenshots/login.png)

---

## 🚀 Getting Started

### Prerequisites
- **Java 21** (JDK)
- **Node.js 20.9+** with npm
- **Docker** (for the bundled PostgreSQL) or your own **PostgreSQL 16**
- An **[ImageKit](https://imagekit.io)** account (the free tier works)
- A **Google Cloud** OAuth 2.0 client (only needed for "Continue with Google")

### 1. Clone the repository
```bash
git clone https://github.com/PUNIT-BHARDWAJ/Google-Photos-Clone.git
cd Google-Photos-Clone
```

### 2. Start PostgreSQL
```bash
docker compose up -d
```
This starts PostgreSQL 16 on `localhost:5432` with a `google_photos_clone` database (user and password `postgres`). Hibernate creates the tables on first run.

### 3. Configure the backend
Create `backend/backend/application-local.properties`. It is git-ignored and loaded automatically when the backend runs from that folder.

```properties
# ImageKit - Dashboard > Developer options > API keys
imagekit.public-key=public_xxxxxxxxxxxxxxxxxxxx
imagekit.private-key=private_xxxxxxxxxxxxxxxxxxxx
imagekit.url-endpoint=https://ik.imagekit.io/your_imagekit_id

# JWT signing secret - use a long random string (e.g. `openssl rand -base64 48`)
app.jwt.secret=replace-with-a-long-random-secret

# Google OAuth2 (optional)
spring.security.oauth2.client.registration.google.client-id=your-client-id.apps.googleusercontent.com
spring.security.oauth2.client.registration.google.client-secret=your-client-secret
```

Every value can also come from an environment variable instead:

| Variable | Default |
|---|---|
| `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`, `IMAGEKIT_URL_ENDPOINT` | required |
| `JWT_SECRET` | an insecure placeholder; always set it |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | placeholders (Google sign-in disabled) |
| `DB_USERNAME`, `DB_PASSWORD` | `postgres` / `postgres` |
| `OAUTH2_FRONTEND_REDIRECT_URI` | `http://localhost:3000` |
| `REQUEST_LOG_LEVEL` | `INFO` (`DEBUG` logs every request) |

#### Google OAuth2 setup (optional)
1. Open the [Google Cloud Console](https://console.cloud.google.com) and create or select a project.
2. Go to **APIs & Services → Credentials** and create an **OAuth client ID** (Web application).
3. Add the authorized redirect URI `http://localhost:8080/login/oauth2/code/google`.
4. Add the authorized JavaScript origin `http://localhost:3000`.
5. Copy the client ID and secret into `application-local.properties`.

### 4. Run the backend
```bash
cd backend/backend
./mvnw spring-boot:run        # Windows: mvnw.cmd spring-boot:run
```
The API starts at `http://localhost:8080`.

### 5. Run the frontend
```bash
cd client
npm install
npm run dev
```
The app starts at `http://localhost:3000`. It calls the API at `http://localhost:8080/api` by default; set `NEXT_PUBLIC_API_URL` in `client/.env.local` to point it elsewhere.

### 6. Open the app
Go to `http://localhost:3000`, then create an account or sign in with Google.

---

## 📁 Project Structure

```
Google-Photos-Clone/
├── backend/backend/                 # Spring Boot service (Maven)
│   ├── src/main/java/project/backend/
│   │   ├── config/                  # Security, CORS, JWT/OAuth2/ImageKit properties, request logging
│   │   ├── controllers/             # Auth, User, Photo, PhotoAi, Album, SharedLink, Library, errors
│   │   ├── domain/                  # JPA entities: User, Photo, PhotoMetadata, Album, SharedLink, ...
│   │   ├── dto/                     # Request and response records
│   │   ├── exception/               # Custom exceptions + global JSON error handling
│   │   ├── repository/              # Spring Data JPA repositories
│   │   ├── security/                # JWT filter, OAuth2 success handler
│   │   └── services/                # Business logic (photos, EXIF extraction, sharing, ImageKit, ...)
│   └── src/test/                    # Unit and context tests
│
├── client/                          # Next.js 16 frontend
│   ├── app/
│   │   ├── (app)/                   # Signed-in routes: photos, favorites, albums, search, settings, ...
│   │   ├── (auth)/                  # Login and register
│   │   ├── oauth2/callback/         # Completes Google sign-in
│   │   └── shared/[token]/          # Public, always-dark share page
│   ├── components/
│   │   ├── layout/                  # App shell, sidebar, search bar, page transitions, error state
│   │   ├── photos/                  # Justified grid, tiles, viewer, info panel, AI edit dialog
│   │   ├── albums/  sharing/  uploads/  library/  auth/  provider/
│   │   └── ui/                      # shadcn/ui primitives (Base UI)
│   ├── hooks/                       # TanStack Query hooks, upload queue, selection, ...
│   ├── lib/                         # API client, justified layout algorithm, ImageKit URLs, formatting
│   └── stores/                      # Zustand auth store
│
├── screenshots/                     # README images
└── docker-compose.yml               # Local PostgreSQL
```

---

## 🔑 API Endpoints

All endpoints are under `/api`, return JSON, and report errors as `{ "error": ..., "message": ... }`. 🔒 marks endpoints that need a bearer token.

### Authentication
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | | Create an account |
| POST | `/api/auth/login` | | Sign in with email and password |
| POST | `/api/auth/refresh` | | Exchange a refresh token for new tokens |
| POST | `/api/auth/logout` | 🔒 | Revoke the refresh token |
| GET | `/api/auth/me` | 🔒 | Current user |
| GET | `/oauth2/authorization/google` | | Start Google sign-in |

### Photos
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/photos?status=&starred=&page=&size=` | 🔒 | List photos (active, archived or trashed; optionally starred) |
| GET | `/api/photos/search?q=` | 🔒 | Search by file name |
| GET | `/api/photos/{id}` | 🔒 | Get a photo |
| GET | `/api/photos/{id}/metadata` | 🔒 | Full EXIF metadata |
| POST | `/api/photos/upload` | 🔒 | Upload a photo (multipart) |
| POST | `/api/photos` | 🔒 | Register a photo from an existing ImageKit URL |
| PUT | `/api/photos/{id}/star` | 🔒 | Toggle favorite |
| POST | `/api/photos/archive` | 🔒 | Archive photos |
| POST | `/api/photos/trash` | 🔒 | Move photos to trash |
| POST | `/api/photos/restore` | 🔒 | Restore archived or trashed photos |
| POST | `/api/photos/delete-permanent` | 🔒 | Permanently delete photos |
| DELETE | `/api/photos/{id}` | 🔒 | Permanently delete one photo |
| POST | `/api/photos/{id}/ai/preview` | 🔒 | Preview an AI edit |
| POST | `/api/photos/{id}/ai/apply` | 🔒 | Save an AI edit as a new photo |

### Albums
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/albums` | 🔒 | List albums |
| POST | `/api/albums` | 🔒 | Create an album |
| GET | `/api/albums/{id}` | 🔒 | Get an album |
| PATCH | `/api/albums/{id}` | 🔒 | Rename or set the cover photo |
| DELETE | `/api/albums/{id}` | 🔒 | Delete an album and revoke its share links (photos are kept) |
| GET | `/api/albums/{id}/photos` | 🔒 | List album photos |
| POST | `/api/albums/{id}/photos` | 🔒 | Add photos |
| DELETE | `/api/albums/{id}/photos/{photoId}` | 🔒 | Remove a photo |

### Sharing
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/photos/{id}/share` | 🔒 | Create a photo link (optional expiry) |
| POST | `/api/albums/{id}/share` | 🔒 | Create an album link (optional expiry) |
| GET | `/api/shared-links` | 🔒 | List active links |
| DELETE | `/api/shared-links/{id}` | 🔒 | Revoke a link |
| GET | `/api/public/photos/{token}` | | View a shared photo |
| GET | `/api/public/albums/{token}` | | View a shared album |

### Account & Library
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| PUT | `/api/user/profile` | 🔒 | Update display name and/or change password |
| GET | `/api/library/storage` | 🔒 | Storage usage |
| GET | `/api/library/imagekit-assets` | 🔒 | Browse existing ImageKit assets |
| POST | `/api/library/import` | 🔒 | Import ImageKit assets |

---

## 🧪 Testing & Quality

```bash
# Backend: unit tests plus a Spring context test (needs PostgreSQL running and the ImageKit settings)
cd backend/backend
./mvnw test

# Frontend: type check, lint (zero warnings allowed) and production build
cd client
npx tsc --noEmit
npm run lint -- --max-warnings 0
npm run build
```

---

## 🎨 Design Decisions

- **Justified grid over CSS masonry**: masonry reads top-to-bottom in columns, which scrambles chronological order. A pure, row-based layout function (`client/lib/justified-layout.ts`) packs photos left to right into rows that fill the width exactly, at target row heights of 220px, 180px and 150px on desktop, tablet and mobile.
- **Compositor-only animations**: animations move only `transform` and `opacity`, so they run on the GPU; a grid that skips re-rendering unchanged tiles keeps them smooth on throttled CPUs. Reduced-motion users get instant transitions.
- **True dark mode**: a `#0a0a0a` background rather than dark grey, semantic colour tokens used throughout, every text pair audited against WCAG AA, and the theme applied before first paint.
- **Resilient token refresh**: only a definite rejection signs the user out; network failures retry with backoff.
- **Privacy-first sharing**: public DTOs are deliberately minimal, with no GPS coordinates, internal IDs or owner details.
- **Secrets stay out of git**: all credentials come from the environment or a git-ignored local file.

---

## 📄 License

[MIT](LICENSE)

---

## 🙏 Acknowledgments

- [Google Photos](https://photos.google.com), for design inspiration
- [shadcn/ui](https://ui.shadcn.com) and [Base UI](https://base-ui.com), for accessible components
- [ImageKit](https://imagekit.io), for image hosting, transformations and AI edits
- [Framer Motion](https://motion.dev), for animations
- Sample photos in the screenshots: [Unsplash](https://unsplash.com) photographers, via [Lorem Picsum](https://picsum.photos)
