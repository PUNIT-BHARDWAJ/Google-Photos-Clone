# Deployment Guide

Deploys the app across three free tiers: **Vercel** (Next.js frontend),
**Render** (Spring Boot API in Docker) and **Neon** (PostgreSQL). ImageKit,
Gemini and Google OAuth2 are already cloud services and need no hosting — only
configuration.

Nothing in this repo contains a secret. Every credential is read from an
environment variable set in a dashboard.

## Architecture

```
┌──────────────┐      ┌───────────────┐      ┌──────────────┐
│   Vercel     │─────▶│    Render     │─────▶│     Neon     │
│  Next.js 16  │ HTTPS│ Spring Boot 4 │ JDBC │  PostgreSQL  │
│  frontend    │◀─────│  API (Docker) │◀─────│   (SSL)      │
└──────────────┘      └───────┬───────┘      └──────────────┘
                              │
                     ┌────────┴─────────┐
                     │ External services│
                     │  • ImageKit      │  photo storage + CDN
                     │  • Gemini AI     │  tagging, search, edits
                     │  • Google OAuth2 │  "Continue with Google"
                     └──────────────────┘
```

## Before you start

You need accounts for: [Neon](https://neon.tech), [Render](https://render.com),
[Vercel](https://vercel.com), [ImageKit](https://imagekit.io) and a
[Google Cloud](https://console.cloud.google.com) project. A
[Gemini API key](https://aistudio.google.com/apikey) is optional — without it
the AI features report "not configured" and everything else works.

Sign in to Neon, Render and Vercel **with GitHub** so they can see the repo.

---

## Step 1 — Database (Neon)

1. Open https://neon.tech and sign up with GitHub.
2. **Create project** → name it `google-photos-clone`, pick the region closest
   to Render's (Oregon → **AWS US West 2**), keep the default Postgres version.
3. On the project dashboard, open **Connection string** and copy it. It looks
   like:
   ```
   postgresql://neondb_owner:npg_xxxxxxxx@ep-cool-lab-123.us-west-2.aws.neon.tech/neondb?sslmode=require
   ```
4. Keep it for Step 2. Either the `postgresql://` form above or a
   `jdbc:postgresql://…` string works — the backend normalises both and forces
   `sslmode=require`, which Neon needs.

Free tier: 0.5 GB storage, and the database sleeps when idle (it wakes on the
first query, which is why the first request after a pause is slow).

---

## Step 2 — Backend (Render)

1. Open https://render.com → sign up with GitHub → **New +** → **Web Service**.
2. Connect the repository `PUNIT-BHARDWAJ/Google-Photos-Clone`.
3. Configure:

   | Field | Value |
   |---|---|
   | Name | `google-photos-api` |
   | Language / Runtime | **Docker** |
   | Branch | `main` |
   | Root Directory | `backend/backend` |
   | Dockerfile Path | `./Dockerfile` |
   | Region | Oregon (US West) |
   | Instance Type | Free |
   | Health Check Path | `/actuator/health` |

4. Add environment variables (**Advanced** → **Add Environment Variable**):

   | Key | Value |
   |---|---|
   | `DATABASE_URL` | the Neon connection string from Step 1 |
   | `JWT_SECRET` | a long random string — `openssl rand -base64 48` |
   | `IMAGEKIT_PUBLIC_KEY` | ImageKit dashboard → Developer options → API keys |
   | `IMAGEKIT_PRIVATE_KEY` | same page |
   | `IMAGEKIT_URL_ENDPOINT` | e.g. `https://ik.imagekit.io/your_id` |
   | `GOOGLE_CLIENT_ID` | Google Cloud Console → Credentials |
   | `GOOGLE_CLIENT_SECRET` | same page |
   | `GEMINI_API_KEY` | optional, from AI Studio |
   | `FRONTEND_URL` | `https://placeholder.vercel.app` — corrected in Step 4 |
   | `BACKEND_URL` | `https://google-photos-api.onrender.com` (your service URL) |

   Don't set `PORT`: Render injects it and the app reads it.

5. **Create Web Service**. The first build takes ~5 minutes (Maven downloads
   the dependency tree once; later deploys reuse that layer).
6. When it goes live, copy the service URL, e.g.
   `https://google-photos-api.onrender.com`. If it differs from what you put in
   `BACKEND_URL`, fix that variable now.
7. Check it: open `https://google-photos-api.onrender.com/actuator/health` —
   it should return `{"status":"UP", …}`.

> **Alternative:** the repo has a `render.yaml` blueprint. **New +** →
> **Blueprint** → select the repo, and Render creates the service with these
> settings, prompting for each secret.

**Free tier behaviour:** the service sleeps after 15 minutes idle and takes
20–30 seconds to wake. The frontend handles this — see *Cold starts* below.

---

## Step 3 — Frontend (Vercel)

1. Open https://vercel.com → **Add New…** → **Project** → import
   `PUNIT-BHARDWAJ/Google-Photos-Clone`.
2. Configure:

   | Field | Value |
   |---|---|
   | Framework Preset | Next.js (detected) |
   | Root Directory | **`client`** — click *Edit* and select it |
   | Build / Output settings | leave as detected |

3. Add an environment variable:

   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | `https://google-photos-api.onrender.com/api` |

   **The `/api` suffix matters.** API calls go to this URL, and the
   "Continue with Google" link is derived from it by dropping `/api`.

4. **Deploy**, then copy the resulting URL, e.g.
   `https://google-photos-clone.vercel.app`.

---

## Step 4 — Point the two at each other

1. Render → your service → **Environment**:
   - set `FRONTEND_URL` to the exact Vercel URL (`https://…vercel.app`, no
     trailing slash),
   - confirm `BACKEND_URL` is the Render URL.
2. **Save changes** — Render redeploys automatically.

`FRONTEND_URL` is what the API allows through CORS and where it sends users
after Google sign-in, so a typo here shows up as a CORS error or a redirect to
the wrong place.

---

## Step 5 — Google OAuth2 production URLs

1. [Google Cloud Console](https://console.cloud.google.com) → **APIs &
   Services** → **Credentials** → your OAuth 2.0 Client ID.
2. **Authorized redirect URIs** → add (exactly, no trailing slash):
   ```
   https://google-photos-api.onrender.com/login/oauth2/code/google
   ```
3. **Authorized JavaScript origins** → add:
   ```
   https://google-photos-clone.vercel.app
   ```
4. **Save.** Changes can take a few minutes to take effect.

Keep the localhost entries — you need them for development.

---

## Step 6 — Verify

Open the Vercel URL and check:

1. **Register** an account (first request may take ~30s while Render wakes —
   the splash screen explains this).
2. **Upload** a photo; it should appear in the grid.
3. **Continue with Google** completes and lands back in the library.
4. **Settings → AI features** shows the Gemini status, and analysis works if
   you set a key.
5. **Search, filters, albums, sharing**, dark mode and the mobile layout.
6. Open a shared link in a private window — it should load without signing in.

---

## Step 7 — Add the live URL to the README

Once the deployment works, put the links at the top of `README.md`, under the
title:

```markdown
**🌐 [Live demo](https://google-photos-clone.vercel.app)**

![Vercel](https://img.shields.io/badge/deployed%20on-Vercel-black?logo=vercel)
![Render](https://img.shields.io/badge/API%20on-Render-46E3B7?logo=render)
![Neon](https://img.shields.io/badge/database-Neon-00E599?logo=postgresql&logoColor=white)
```

And mention in *Getting Started* that the hosted demo exists, with the caveat
that the first request may take ~30 seconds.

---

## The demo account

The hosted deployment carries a shared account so visitors can look around a
populated library without registering. Its credentials are printed on the
sign-in page:

```
demo@google-photos-clone.app / DemoPass123!
```

The API refuses to change that account's password or display name, and refuses
permanent deletion of its photos — otherwise the first visitor could lock
everyone else out, or empty the trash and take the images with them. Everything
else (uploading, starring, albums, archiving, trashing) still works, so the demo
stays explorable.

### Seeding it

1. Register the account once, against the production API:
   ```bash
   curl -X POST https://your-service.onrender.com/api/auth/register      -H "Content-Type: application/json"      -d '{"email":"demo@google-photos-clone.app","password":"DemoPass123!","displayName":"Demo User"}'
   ```
2. Open **Neon → SQL Editor**, paste [`scripts/seed-demo.sql`](scripts/seed-demo.sql)
   and run it. (Or `psql "$DATABASE_URL" -f scripts/seed-demo.sql`.)
3. It prints the result: **28 photos, 8 starred, 3 albums**.

The script clears the demo account's photos and albums first, so re-running it
resets the demo to a known state after visitors have been poking at it.

### What the seed contains

The 28 photographs from the development library, with every Gemini caption,
tag, scene type and colour exactly as the model produced them. `date_taken` is
demo data: these are stock images with no EXIF date, and without one the whole
library collapses under a single day heading. Upload timestamps are real.

> **Note:** the seeded rows point at the same ImageKit files as the development
> library — the script copies database rows, not images. Permanently deleting
> one of those photos from your own account would remove the file from ImageKit
> and break it in the demo too. (The demo account itself can't permanently
> delete anything.) To decouple them entirely, copy the assets into a separate
> ImageKit folder and update the URLs in the seed.

---

## Cold starts

Render's free plan stops the container after 15 minutes of inactivity, so the
first request wakes it (~30s) and Neon's compute wakes with it.

The frontend treats this as a state, not an error:

- Requests report how long they've been waiting (`lib/api-activity.ts`).
  Uploads, downloads and AI calls are excluded — they're slow when healthy.
- After **10s** a splash screen appears: logo, "Starting up".
- After **30s** it becomes "Waking up the server … about 30 seconds".
- After **60s** it says it's taking longer than usual, and at **90s** offers a
  retry button.
- A dot in the corner shows connection state: green connected, amber
  connecting, red unreachable.

To avoid cold starts entirely, upgrade the Render instance or ping
`/actuator/health` every 10 minutes from an uptime monitor.

---

## Testing the production profile locally

The prod profile reads everything from the environment, so it runs locally too:

```bash
cd backend/backend
SPRING_PROFILES_ACTIVE=prod PORT=8099 \
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/google_photos_clone" \
JWT_SECRET="$(openssl rand -base64 48)" \
IMAGEKIT_PUBLIC_KEY=... IMAGEKIT_PRIVATE_KEY=... IMAGEKIT_URL_ENDPOINT=... \
GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... \
FRONTEND_URL=http://localhost:3000 BACKEND_URL=http://localhost:8099 \
./mvnw spring-boot:run
```

With nothing set, it lists exactly which variables are missing and then stops
at the database — no stack trace to decode.

To test the container itself:

```bash
cd backend/backend
docker build -t photos-api .
docker run -p 8099:8080 -e DATABASE_URL=... -e JWT_SECRET=... photos-api
```

---

## Troubleshooting

### Build fails on Render
Check **Logs**. The build needs `backend/backend` as Root Directory — if it
says "no Dockerfile found", that field is wrong.

### "Driver claims to not accept jdbcUrl"
`DATABASE_URL` is malformed. Both of these are accepted:
```
postgresql://user:password@host/dbname?sslmode=require
jdbc:postgresql://host/dbname?sslmode=require
```
A URL with no credentials needs `DATABASE_USERNAME` and `DATABASE_PASSWORD` set
separately.

### Service starts, then Render marks it unhealthy
The health check path must be `/actuator/health` and it must be public (it is,
by default). Check the logs for the database connection failing — a wrong Neon
password shows up here.

### CORS errors in the browser console
The console names the blocked origin. `FRONTEND_URL` on Render must match it
character for character, including `https://` and no trailing slash. Redeploy
after changing it.

### OAuth2 returns "redirect_uri_mismatch"
The URI in Google Cloud Console must be exactly
`https://<render-service>.onrender.com/login/oauth2/code/google`, and
`BACKEND_URL` on Render must be that same host.

### Signed in, but every API call returns 401
`JWT_SECRET` changed between deploys, which invalidates tokens issued earlier.
Sign in again. Keep the value stable.

### Photos don't load
Check `IMAGEKIT_URL_ENDPOINT` on Render, and that the ImageKit account still
has quota. Images are served straight from ImageKit's CDN, not through the API.

### AI features say "not configured"
`GEMINI_API_KEY` isn't set, or the free tier's daily quota is spent (it resets
at midnight Pacific).

### First request takes 30 seconds
Expected on the free plan — see *Cold starts*.

---

## Free tier limits

| Service | Limit | What it means here |
|---|---|---|
| Neon | 0.5 GB storage, sleeps when idle | Thousands of photo records; metadata only, the files live in ImageKit |
| Render | 512 MB RAM, sleeps after 15 min | The JVM is capped at 70% of that; first request after idle is slow |
| Vercel | 100 GB bandwidth/month | Static assets and SSR for the frontend |
| ImageKit | 20 GB bandwidth/month | Photo storage and delivery |
| Gemini | 20 requests/day (free tier) | Analysis, AI search ranking and edit suggestions |
