# Hub Hub

**Zero to One Hundred Programming with AI**
Created by **Nima Hojjati**

Hub Hub is an AI-powered programming platform that helps users transform ideas into
professional prompts, design websites, plan Android application projects, and get
programming consultation — through a Persian, RTL, glassmorphism-styled interface.

## Features

- **Auth (local, client-side)** — registration and login with email/password
  validation, kept entirely in the browser (`localStorage` / `sessionStorage`).
  Ready to be swapped for a real backend/database (see *Connecting a real backend* below).
- **Dashboard** — four interactive sections: Idea → Prompt, Website Design,
  Android App Design, Project Consultant.
- **Side menu** — Creator info, About Hub Hub, History, Logout.
- **AI chat interface** per section — text input, microphone input (Web Speech API),
  text-to-speech playback, copy-to-clipboard, clear conversation, loading state.
- **History** — conversations are saved locally per category and can be reopened.
- **Isolated AI service layer** (`src/ai-service.js`) — the only file you need to
  touch to connect a real AI provider. Until an API key/backend is configured, it
  returns clearly-labeled sample responses so the whole UI can be tested end to end.

## Project structure

```
hub-hub/
├── index.html              # entry point
├── package.json
├── README.md
├── LICENSE
├── .gitignore
├── .env.example
├── assets/
│   └── css/
│       └── style.css       # all styling
├── src/
│   ├── app.js               # UI logic: auth, views, chat, history
│   └── ai-service.js        # AI service layer (API key goes here)
└── public/                  # static assets (icons, images) — currently empty
```

## Installation

No build step is required — this is a static site.

```bash
git clone <your-repo-url>
cd hub-hub
npm install   # only needed for the local dev server (optional)
```

## Running locally

```bash
npm start
```

This serves the folder at `http://localhost:3000` using `serve`. You can also just
open `index.html` directly in a browser, or use any static file server.

## Configuration / Environment variables

Copy `.env.example` to `.env` and fill in your real values **once you have a backend**:

```
AI_API_KEY=
AI_API_PROVIDER=
```

**Never commit a real API key.** The current frontend keeps `AI_API_KEY` empty in
`src/ai-service.js` on purpose — until you add a real key there (for local testing only)
or, better, move the call to a backend that reads `AI_API_KEY` from the environment.

## Connecting a real AI API

Open `src/ai-service.js`:

1. Set `AI_API_KEY` (local/dev testing only), **or**
2. Point `AI_BACKEND_ENDPOINT` to a real backend route (recommended for production)
   that holds the key server-side and calls your AI provider.

Nothing else in the app needs to change — `getAIResponse()` is the single function
every chat screen calls.

## Connecting a real backend / database

The auth functions in `src/app.js` (`getUsers`, the register/login submit handlers)
currently read/write `localStorage`. To use a real backend:

1. Replace `getUsers()` / the register and login handlers with `fetch()` calls to
   your auth API.
2. Store the session token instead of the plain user object.
3. Move conversation history (`getHistory` / `saveHistory`) to the backend, keyed
   by the authenticated user's ID.

## Building

No build step — deploy the files as-is.

## Deployment

Any static host works:

- **GitHub Pages** — push to a repo, enable Pages on the `main` branch (root).
- **Firebase Hosting (Google)** — `firebase init hosting`, set the public directory
  to the project root, then `firebase deploy`.
- **Netlify / Vercel** — connect the repo, no build command needed, publish directory `/`.

If you add a real backend (auth, AI proxy, project/ZIP generation), deploy it
separately (e.g. Cloud Run, Render, Railway) and point `AI_BACKEND_ENDPOINT` /
your auth calls to its URL.

## Publishing to GitHub

```bash
git init
git add .
git commit -m "Initial commit — Hub Hub"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

`.env` is already excluded via `.gitignore` — only `.env.example` is committed.

---

**Creator:** Nima Hojjati
