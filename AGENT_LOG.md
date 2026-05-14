# Agent Log

## 2026-05-13 18:19:47 -05:00

- User goal: build a mobile-first PWA named "Prospect Park Transit Board" for live Metro Transit NexTrip E Line and Green Line favorites near Prospect Park / University of Minnesota.
- Files changed: created Vite React TypeScript app, `src/transit.ts`, `src/App.tsx`, `src/styles.css`, PWA manifest, service worker, icons, `.gitignore`, `AGENTS.md`, and this log.
- Commands/tests run: CORS probe with `Origin: http://localhost:5173`; live NexTrip endpoint checks for all five feeds; `npm install`; `npm run build`; Vite dev server on `http://127.0.0.1:5173/`; in-app browser DOM/manual refresh check; headless Chrome mobile viewport check at 390px.
- Decisions made: direct browser fetch is acceptable because NexTrip returns `Access-Control-Allow-Origin: *`; no proxy/backend added; all feeds are filtered by configured `route_id` and `direction_id`; service worker registers only for production builds.
- Verification notes: build passes; Rec Center stop `16142` returned routes `925`, `2`, and `122`, and filtering kept only route `925` northbound; mobile check reported `scrollWidth: 390`, five feed cards, three sections, and all section labels present.
- Generated artifact: mobile screenshot at `artifacts/mobile-390.png`.
- Recommended next steps: optionally add a deployed HTTPS host so the PWA can be installed on the phone from the home screen.

## 2026-05-13 19:04:44 -05:00

- User goal: add local landmark labels to two stop names.
- Files changed: `src/transit.ts`.
- Commands/tests run: `npm run build`; reloaded in-app browser at `http://127.0.0.1:5173/` and confirmed both labels render.
- Decision made: display labels use `University & 27th Ave Station (Accolade)` and `University & Huron Station (Wahu)`.

## 2026-05-13 19:32:30 -05:00

- User goal: prepare to push the project to GitHub as `TripTap`.
- Files changed: `.gitignore`, `package.json`, `package-lock.json`, `AGENT_LOG.md`.
- Commands/tests run: `npm run build`; `git init -b main`; `git add`; `git commit -m "Initial TripTap transit board"`.
- Decisions made: npm package name changed to `triptap`; generated upload ZIPs, logs, build output, `node_modules`, artifacts, and TypeScript build info are ignored.
- Unresolved issue: GitHub CLI is not installed and the GitHub connector was not connected, so remote creation/push still needs either a manually created empty GitHub repo URL or GitHub CLI/connector authentication.

## 2026-05-13 19:34:22 -05:00

- User goal: change the visible/browser/PWA title to `TripTap`.
- Files changed: `index.html`, `src/App.tsx`, `public/manifest.webmanifest`, `public/sw.js`, `public/icons/icon.svg`, `AGENTS.md`, `AGENT_LOG.md`.
- Commands/tests run: `npm run build`.
- Decision made: on-screen title is `TripTap`; contextual kicker remains `Prospect Park Transit Board`.

## 2026-05-13 19:35:17 -05:00

- User goal: push the local TripTap project to GitHub.
- Commands run: `git remote add origin https://github.com/ApurvK032/TripTap.git`; `git push -u origin main`.
- Result: pushed `main` to `origin/main` at commit `3f0ac5c`.
