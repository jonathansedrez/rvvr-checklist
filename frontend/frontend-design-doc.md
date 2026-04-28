# Frontend Design Doc — RVVR Checklist

## Section 1 — Overview & Goals

A real-time checklist for church service teams. During a service, all members can see the checklist and mark tasks as done. An admin manages teams, sections, and tasks outside of service hours.

Two modes:
- **Public view** (`/`): Anyone opens this URL on their phone or a shared screen. No login. They see all teams → sections → tasks and can toggle any task complete/incomplete.
- **Admin view** (`/admin`): Authenticated users manage the structure (create/rename/delete teams, sections, tasks).

Core constraint: Changes made by one person must appear instantly for everyone else — driven by the WebSocket that broadcasts `task:toggled` events.

---

## Section 2 — Tech Stack

**Runtime & Package Manager: Bun**
Used for installing dependencies and running scripts. The backend already runs on Bun, so the frontend stays consistent.

**UI Framework: Svelte 5**
Compiles components to vanilla JS at build time — no virtual DOM overhead. Uses the Svelte 5 runes system (`$state`, `$props`, `$derived`) for reactivity. Single-file components keep markup, logic, and styles co-located.

**Language: TypeScript**
Enforced at project creation via the official Svelte scaffold. All `.svelte` files use `<script lang="ts">` and all modules are `.ts`. Provides type safety across API responses, store shapes, and component props.

**Bundler: Vite**
Official Svelte toolchain. Handles `.svelte` file compilation, hot module replacement in dev, and optimized production builds. Bun is used as the runtime but Vite handles the frontend bundling.

**Styling: Tailwind CSS v4**
Utility-first CSS. No configuration file needed in v4 — just a single CSS import. Integrated directly into Vite via the official Tailwind Vite plugin.

**Routing: svelte-spa-router**
Lightweight hash-based client-side router. Suitable for a simple SPA with three routes: public checklist, admin login, and admin dashboard.

**PWA: vite-plugin-pwa**
Adds a Web App Manifest and service worker via Workbox. Enables "Add to Home Screen" on mobile devices and caches the last-known checklist for offline viewing. Real-time WebSocket updates resume automatically when connectivity is restored.

**HTTP: native fetch**
No external HTTP client. A thin wrapper module handles attaching the auth token and surfacing errors consistently.

---

## Section 3 — File Structure

Source code lives under `src/` and is organized into three top-level folders: `lib/` for non-UI logic (API, WebSocket, stores), `pages/` for route-level components, and `components/` for reusable UI pieces.

---

## Section 4 — Routing

Client-side routing is handled by **svelte-spa-router** using hash-based URLs. Hash routing avoids server-side redirect configuration, which is important since the frontend is a static build served by the backend.

The app has three routes:

- **`/`** — Public checklist view. No auth required. Accessible to anyone during service.
- **`/admin/login`** — Admin login form. Redirects to `/admin` if a valid token is already present.
- **`/admin`** — Admin dashboard. Protected route — redirects to `/admin/login` if unauthenticated.

Route protection is handled by a guard condition inside the Admin page itself, checking the auth store on mount and redirecting if no valid token is found.

---

## Section 5 — Testing

Testing is handled by **Vitest**, which integrates natively with Vite and supports TypeScript out of the box. Component testing uses **@testing-library/svelte** for rendering and interacting with Svelte components in a jsdom environment.

- **Unit tests** — for `lib/` modules (API wrapper, WebSocket logic, store mutations).
- **Component tests** — for critical UI pieces like `TaskRow` and the admin forms.

Test files live alongside the source file they cover, using the `.test.ts` naming convention.

End-to-end testing is out of scope for v1.
