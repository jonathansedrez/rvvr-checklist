# RVVR Checklist Backend - Design Document

---

## 1. Overview

### Project Name

RVVR Checklist Backend

### Purpose

A real-time checklist application for church services that allows team members to track tasks during a service. The system enables everyone on the schedule to see what has been completed and what remains pending.

### Core Features

- Real-time updates via WebSocket
- Task items with completion status (true/false) and descriptions
- Section-based organization for tasks
- **Public access** for viewing and marking tasks as done/not done
- **Authentication only** for administrative actions (adding/editing teams, sections, and tasks)

### Target Audience

- Church service team members (public users - can view and toggle tasks)
- Administrators (authenticated - can manage checklist structure)

---

## 2. Goals and Non-Goals

### Goals

- **Real-time synchronization** - All connected clients see updates instantly via WebSocket
- **Fast performance** - Minimal latency for toggling task completion
- **Simple public access** - No login required to view or mark tasks during service
- **Team support** - Organize checklists by teams (e.g., "Worship", "Tech", "Welcome")
- **Custom sections** - Authenticated users can create time-based sections (e.g., pre-service, during-service, post-service)
- **Secure admin actions** - Only authenticated users can create/modify teams, sections, and tasks
- **Lightweight** - Simple to deploy and maintain

### Non-Goals

- User roles/permissions beyond admin vs public
- Offline support
- Historical tracking/analytics of past services
- Multi-church/tenant support
- Task assignments (who is responsible)
- Chat or comments on tasks

---

## 3. Data Model

### Entities

**Team**
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| name | String | Team name (e.g., "Tech", "Worship") |
| created_at | Timestamp | Creation date (used for ordering) |
| updated_at | Timestamp | Last update |

**Section**
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| team_id | UUID | Foreign key to Team |
| name | String | Section name (e.g., "Pre-service") |
| created_at | Timestamp | Creation date (used for ordering) |
| updated_at | Timestamp | Last update |

**Task**
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| section_id | UUID | Foreign key to Section |
| title | String | Short display text |
| slug | String | Nullable, reference to frontend wiki |
| completed | Boolean | Default: false |
| created_at | Timestamp | Creation date (used for ordering) |
| updated_at | Timestamp | Last update |

### Relationships

```
Supabase Auth (manages admin users)
         │
         ▼
Team ──< Section ──< Task
     1:N        1:N
```

### Example

```
Tech Team
├── Pre-service
│   ├── ☐ Test microphones
│   └── ☐ Check projector
├── During-service
│   └── ☐ Record sermon
└── Post-service
    └── ☐ Shut down equipment
```

---

## 4. API Design

### Base URL

```
/api/v1
```

### Authentication

- Public endpoints: No auth required
- Admin endpoints: Bearer token (JWT) in `Authorization` header

---

### Public Endpoints

**Teams**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/teams` | List all teams with sections and tasks |
| GET | `/teams/:id` | Get single team with sections and tasks |

**Tasks**
| Method | Endpoint | Description |
|--------|----------|-------------|
| PATCH | `/tasks/:id/toggle` | Toggle task completion status |

---

### Admin Endpoints (Authenticated)

**Teams**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/teams` | Create team |
| PUT | `/teams/:id` | Update team |
| DELETE | `/teams/:id` | Delete team |

**Sections**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/teams/:teamId/sections` | Create section |
| PUT | `/sections/:id` | Update section |
| DELETE | `/sections/:id` | Delete section |

**Tasks**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/sections/:sectionId/tasks` | Create task |
| PUT | `/tasks/:id` | Update task |
| DELETE | `/tasks/:id` | Delete task |

**Auth**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Login, returns JWT |

---

### WebSocket

**Connection**

```
ws://host/ws
```

**Events (Server → Client)**
| Event | Payload | Description |
|-------|---------|-------------|
| `task:toggled` | `{ taskId, completed }` | Task completion changed |

---

## 5. Tech Stack

| Layer     | Technology                     |
| --------- | ------------------------------ |
| Runtime   | Bun                            |
| Framework | Hono                           |
| WebSocket | Bun native WebSocket + hono/ws |
| Database  | Supabase PostgreSQL            |
| ORM       | Prisma                         |
| Auth      | Supabase Auth (JWT validation) |

### Summary

- **Bun** - Fast runtime with native TypeScript and WebSocket
- **Hono** - Lightweight, fast, works great with Bun
- **Prisma** - Type-safe database access, great DX, easy migrations
- **Supabase Auth** - Managed auth, backend just validates JWTs
- **Supabase PostgreSQL** - Managed database, no ops overhead

---

## 6. Architecture

### High-Level Overview

![High-Level Architecture](./diagrams/architecture-overview.drawio.svg)

**Diagram should include:**

- Clients (Browser/Mobile)
- Bun + Hono Backend (Routes, Services, WebSocket Manager, Prisma)
- Supabase PostgreSQL
- Supabase Auth
- Connection types: REST (HTTP), WebSocket (WS)

---

### Request Flows

![Request Flows](./diagrams/request-flows.drawio.svg)

**Diagram should include:**

1. Public GET flow (Client → Backend → Database)
2. Toggle Task flow (Client → Backend → Database → WebSocket broadcast to all clients)
3. Admin flow (Client → JWT validation → Backend → Database)

---

### Project Structure

```
backend/
├── src/
│   ├── index.ts              # Entry point
│   ├── app.ts                # Hono app setup
│   ├── routes/
│   │   ├── teams.ts
│   │   ├── sections.ts
│   │   ├── tasks.ts
│   │   └── auth.ts
│   ├── services/
│   │   ├── team.service.ts
│   │   ├── section.service.ts
│   │   └── task.service.ts
│   ├── middleware/
│   │   └── auth.ts
│   ├── ws/
│   │   └── manager.ts
│   └── lib/
│       └── prisma.ts
├── prisma/
│   └── schema.prisma
├── diagrams/                  # draw.io files
│   ├── architecture-overview.drawio
│   └── request-flows.drawio
├── package.json
└── .env
```

---

## 7. Security

### Authentication & Authorization

| Endpoint Type           | Auth Required | Method       |
| ----------------------- | ------------- | ------------ |
| GET teams/tasks         | No            | Public       |
| PATCH toggle task       | No            | Public       |
| POST/PUT/DELETE (admin) | Yes           | Supabase JWT |

**JWT Validation Flow**

1. Admin logs in via Supabase Auth (frontend)
2. Frontend sends JWT in `Authorization: Bearer <token>` header
3. Backend middleware validates JWT with Supabase
4. If valid → allow action; if invalid → 401 Unauthorized

---

### Input Validation

| Layer    | Validation                              |
| -------- | --------------------------------------- |
| Routes   | Zod schemas for request body/params     |
| Prisma   | Type-safe queries prevent SQL injection |
| Database | Constraints (NOT NULL, UNIQUE, FK)      |

---

### Security Headers

```typescript
// Hono middleware
app.use("*", secureHeaders());
```

Headers: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, etc.

---

### Rate Limiting (optional)

| Endpoint      | Limit               |
| ------------- | ------------------- |
| Toggle task   | 60 req/min per IP   |
| Admin actions | 30 req/min per user |

---

### Environment Variables

| Variable            | Description                    | Secret |
| ------------------- | ------------------------------ | ------ |
| DATABASE_URL        | Supabase PostgreSQL connection | Yes    |
| SUPABASE_URL        | Supabase project URL           | No     |
| SUPABASE_ANON_KEY   | Supabase public key            | No     |
| SUPABASE_JWT_SECRET | JWT validation secret          | Yes    |

**Never commit `.env` to git.**

---

## 8. Deployment

### Docker

**Dockerfile**

```dockerfile
FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Build
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bunx prisma generate
RUN bun build ./src/index.ts --outdir ./dist --target bun

# Production
FROM base AS production
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma

EXPOSE 3000
CMD ["bun", "run", "dist/index.js"]
```

---

### Hosting

**Target Platform:** AWS

**Services:** TBD (ECS, App Runner, EC2, or Lambda)

**CI/CD:** TBD

**Infrastructure:** TBD

---

### Local Development

```bash
cp .env.example .env
# Fill in Supabase credentials
bun install
bunx prisma migrate dev
bun run dev
```

---

## 9. Testing

### Test Stack

| Tool                    | Purpose               |
| ----------------------- | --------------------- |
| Bun test                | Built-in test runner  |
| Supertest / Hono client | HTTP endpoint testing |

---

### Test Types

**Unit Tests**

- Services (business logic)
- Utility functions

**Integration Tests**

- API endpoints (REST)
- Database operations (Prisma)

**WebSocket Tests**

- Connection handling
- Broadcast on task toggle

---

### Test Structure

```
backend/
├── src/
│   ├── services/
│   │   ├── task.service.ts
│   │   └── task.service.test.ts
│   └── routes/
│       ├── tasks.ts
│       └── tasks.test.ts
└── tests/
    └── integration/
        └── ws.test.ts
```

---

### Commands

```bash
# Run all tests
bun test

# Watch mode
bun test --watch

# Coverage
bun test --coverage
```
