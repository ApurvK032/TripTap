# TripTap

TripTap is a small mobile-first PWA for quick daily transit checks around Prospect Park and the University of Minnesota.

I built it for personal convenience: instead of opening the official transit app or website and choosing the same route, direction, and stop every time, TripTap opens directly to the departures I usually need.

## What It Shows

TripTap groups live Metro Transit NexTrip departures by everyday trip purpose:

- Home to University
- University to Home
- Green Line

Each card shows:

- route name
- stop or station name
- destination
- departure time text like `Due`, `5 Min`, or `6:20`
- whether the departure is live real-time data or scheduled data

The app refreshes automatically while open and also has a manual refresh button.

## Favorite Feeds

TripTap uses the Metro Transit NexTrip API at:

```text
https://svc.metrotransit.org
```

Configured feeds:

| Trip | Stop or Station | Nickname | Route | Direction |
| --- | --- | --- | --- | --- |
| Home to University | University & 27th Ave Station | Accolade | E Line `925` | SB |
| University to Home | University & U of M Rec Center Station | Rec Center | E Line `925` | NB |
| University to Home | University & Huron Station | Wahu | E Line `925` | NB |
| Green Line | Stadium Village Station | - | Green Line `902` | WB |
| Green Line | East Bank Station | - | Green Line `902` | EB |

Some stop-number NexTrip endpoints include multiple routes. TripTap filters departures by both `route_id` and `direction_id` so unrelated routes do not clutter the board.

## Phone Home Screen Install

TripTap is a Progressive Web App. When you open the hosted website on your phone and use **Add to Home Screen**, your phone installs it like a small app:

- it gets its own home screen icon
- it opens full-screen or app-like instead of as a normal browser tab
- it loads the TripTap board directly
- it can cache the app shell with a service worker

This is not a native iOS or Android widget that updates on the home screen by itself. It is an installed PWA/home-screen app shortcut, which is better for this project because it can open straight to live departures with one tap.

## Tech Stack

- Vite
- React
- TypeScript
- Metro Transit NexTrip API
- Web app manifest
- Service worker
- Cloudflare Pages for hosting

## Development

Install dependencies:

```powershell
npm install
```

Run locally:

```powershell
npm run dev
```

Build production files:

```powershell
npm run build
```

Preview the production build:

```powershell
npm run preview
```

## Deploying

The project is designed for static hosting on Cloudflare Pages.

Cloudflare Pages settings:

```text
Framework preset: Vite
Build command: npm run build
Build output directory: dist
Root directory: /
Production branch: main
```

No backend is required because the Metro Transit NexTrip API allows browser requests from the deployed app.

## Project Notes

- The visible product title is `TripTap`.
- The app context is `Prospect Park Transit Board`.
- Feed definitions live in `src/transit.ts`.
- PWA metadata lives in `public/manifest.webmanifest`.
- Service worker logic lives in `public/sw.js`.
