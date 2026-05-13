# Design Doc — Task Detail Page via Slug

## Section 1 — Overview

### Feature: Task Detail Page via Slug

**Summary**

Tasks with a `slug` field get an info icon in `TaskRow`. Clicking it navigates to a `/task/:slug` route that fetches and renders the corresponding Markdown file directly on the frontend — no backend in the read path.

**Goals for this iteration**

- Surface the info icon only on tasks where `slug` is non-null.
- Navigate to a `/task/:slug` route that fetches and renders the matching Markdown file.
- Markdown files live in `frontend/public/content/tasks/` — served as static assets.
- Frontend fetches `/content/tasks/{slug}.md` directly using the slug.
- The fetch abstraction is designed so the base URL can be swapped to S3 in a future iteration with a single config change.

**Out of scope (this iteration)**

- Uploading or editing Markdown content through the UI.
- S3 integration (deferred to next iteration).
- Fallback UI for missing slugs beyond a simple "not found" state.

**Future iteration**

- Point the base URL to a public S3 bucket — frontend fetch logic stays unchanged.
- Backend exposes a `POST /tasks/:slug/content` endpoint to upload from the frontend editor.

---

## Section 2 — Content Structure & File Convention

**Folder location**

Markdown files live inside `frontend/public/content/tasks/`. Because Vite serves everything in `public/` as static assets at the root, files in this folder are accessible at `/content/tasks/` in the browser with no build step required.

**File naming convention**

Each file is named exactly after the task's `slug` field with a `.md` extension.

- Slug `pre-service-checklist` → file `pre-service-checklist.md`
- Slug `sound-setup` → file `sound-setup.md`

The slug is the single source of truth — no lookup table, no mapping layer.

**Fetch URL pattern**

The frontend constructs the URL as:

```
{BASE_URL}/content/tasks/{slug}.md
```

For the local implementation, `BASE_URL` is empty (relative path). For S3 in the future, `BASE_URL` becomes the bucket's public base URL via an environment variable — the rest of the path stays identical.

**"Not found" behavior**

If the fetch returns a non-200 response (file doesn't exist), the page renders a minimal "content not available" state. No redirect, no error thrown.

**Folder structure overview**

```
frontend/
  public/
    content/
      tasks/
        pre-service-checklist.md
        sound-setup.md
```

---

## Section 3 — Routing & Navigation

**New route**

A new route `/task/:slug` is added to `App.svelte` alongside the existing routes. It maps to a new `TaskDetail` page component.

```
/              → Public
/admin/login   → AdminLogin
/admin         → Admin
/task/:slug    → TaskDetail  ← new
```

**TaskRow changes**

When `task.slug` is non-null, `TaskRow` renders a small info icon button to the right of the task title. Clicking it navigates to `/task/{slug}` using `svelte-spa-router`'s `push()` function. The toggle/complete behavior is unchanged.

The info icon is only rendered conditionally — tasks without a slug look exactly as they do today.

**TaskDetail page**

A new `src/pages/TaskDetail.svelte` component receives the `slug` param from the router. On mount it fetches `/content/tasks/{slug}.md`, parses the Markdown to HTML, and renders it. While loading it shows a minimal loading state. If the fetch fails or returns non-200 it shows a "content not available" message.

The page includes a back button that returns the user to `/` using the router.

**Navigation flow**

```
Public page
  └── TaskRow (slug present)
        └── info icon click
              └── /task/:slug
                    └── TaskDetail
                          └── back → /
```

---

## Section 4 — Markdown Rendering

**Parsing library**

The frontend uses `marked` to parse Markdown content into HTML. Lightweight, no dependencies, good fit for the Vite + Svelte stack. Parsing happens entirely in the browser after the fetch resolves.

**Rendering**

The HTML string from `marked` is injected via Svelte's `{@html}` directive inside a scoped wrapper element. The wrapper carries a `prose` class that scopes all Markdown typography styles without leaking into the rest of the app.

**Styling**

Tailwind's `@tailwindcss/typography` plugin provides the `prose` class, handling all Markdown element styling — headings, paragraphs, lists, code blocks, blockquotes — without custom CSS.

**Library additions**

- `marked` — Markdown to HTML parser
- `@tailwindcss/typography` — prose styling via Tailwind plugin
