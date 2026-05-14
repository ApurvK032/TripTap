# TripTap

## Project Purpose
Mobile-first PWA, branded as TripTap, for one-tap Metro Transit NexTrip departures near Prospect Park / University of Minnesota.

## Tech Stack
- Vite + React + TypeScript
- Metro Transit NexTrip API: `https://svc.metrotransit.org`
- PWA assets: web app manifest, icon, service worker

## Setup / Run / Test
- Install: `npm install`
- Dev server: `npm run dev`
- Build: `npm run build`
- Preview production build: `npm run preview`

## Important Files
- `src/`: React app source
- `src/transit.ts`: NexTrip feed definitions and route/direction filtering
- `public/manifest.webmanifest`: PWA metadata
- `public/sw.js`: service worker
- `public/icons/`: install icons

## Coding Conventions
- Keep edits small and focused.
- Prefer typed API models and explicit route/direction filtering.
- Keep UI mobile-first, readable at a glance, and useful while loading or offline.

## Workflow Notes
- Metro Transit NexTrip CORS was checked from `http://localhost:5173` on 2026-05-13; responses included `Access-Control-Allow-Origin: *`, so the app uses direct client fetch and does not need a proxy.
- Stop-number feeds can include unrelated routes; keep filtering by both `route_id` and `direction_id`.
- The service worker is registered only in production builds to avoid stale dev-server behavior.
- Update `AGENT_LOG.md` after meaningful work with commands, decisions, and next steps.
