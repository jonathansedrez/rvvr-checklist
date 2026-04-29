# RVVR Checklist — Frontend

Real-time checklist SPA for church service teams. Built with Svelte 5, Vite, TypeScript, Tailwind CSS v4, and a WebSocket connection to the backend.

## Stack

| Tool | Purpose |
|---|---|
| Svelte 5 + Vite | UI framework and bundler |
| TypeScript | Type safety across components, stores, and API |
| Tailwind CSS v4 | Utility-first styling |
| svelte-spa-router | Hash-based client-side routing |
| vite-plugin-pwa | Web App Manifest + Workbox service worker |
| Vitest + @testing-library/svelte | Unit and component tests |

## Routes

| Route | Access | Description |
|---|---|---|
| `/` | Public | Real-time checklist — toggle tasks, updates broadcast to all clients |
| `/#/admin/login` | Public | Admin login form |
| `/#/admin` | Auth required | Manage teams, sections, and tasks |

## Setup

```bash
cp .env.example .env   # set VITE_API_URL and VITE_WS_URL
bun install
bun dev
```

## Scripts

```bash
bun dev          # development server with HMR
bun build        # production build
bun preview      # preview production build
bun run check    # TypeScript + svelte-check
bun test         # run tests once
bun run test:watch   # watch mode
```

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3000/api/v1` | Backend REST API base URL |
| `VITE_WS_URL` | `ws://localhost:3000/ws` | Backend WebSocket URL |
