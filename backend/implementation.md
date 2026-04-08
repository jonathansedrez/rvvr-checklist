# Implementation Plan

---

## Summary

| Phase | Description    | Status         |
| ----- | -------------- | -------------- |
| 1     | Project Setup  | ⬜ Not Started |
| 2     | Database       | ⬜ Not Started |
| 3     | Core API       | ⬜ Not Started |
| 4     | Authentication | ⬜ Not Started |
| 5     | WebSocket      | ⬜ Not Started |
| 6     | Testing        | ⬜ Not Started |
| 7     | Docker         | ⬜ Not Started |
| 8     | Deployment     | ⬜ Not Started |

## Overview

This document outlines the implementation phases for the RVVR Checklist Backend.

---

## Phase 1: Project Setup

### Goals

Initialize the project with Bun, Hono, Prisma, and configure the development environment.

### Tasks

- [ ] Initialize Bun project (`bun init`)
- [ ] Install dependencies
  - [ ] `hono` - Web framework
  - [ ] `prisma` - ORM
  - [ ] `@prisma/client` - Prisma client
  - [ ] `@supabase/supabase-js` - Supabase client
  - [ ] `zod` - Input validation
- [ ] Install dev dependencies
  - [ ] `typescript`
  - [ ] `@types/bun`
- [ ] Configure TypeScript (`tsconfig.json`)
- [ ] Create project structure
  - [ ] `src/index.ts`
  - [ ] `src/app.ts`
  - [ ] `src/routes/`
  - [ ] `src/services/`
  - [ ] `src/middleware/`
  - [ ] `src/ws/`
  - [ ] `src/lib/`
- [ ] Create `.env.example` with required variables
- [ ] Create `.gitignore`
- [ ] Setup basic Hono app with health check endpoint (`GET /health`)

### Deliverables

- Running Bun + Hono server on `localhost:3000`
- `GET /health` returns `{ "status": "ok" }`

---

## Phase 2: Database

### Goals

Set up Prisma with Supabase PostgreSQL and create the database schema.

### Tasks

- [ ] Initialize Prisma (`bunx prisma init`)
- [ ] Configure `DATABASE_URL` in `.env`
- [ ] Create Prisma schema (`prisma/schema.prisma`)
  - [ ] `Team` model
  - [ ] `Section` model
  - [ ] `Task` model
- [ ] Run initial migration (`bunx prisma migrate dev`)
- [ ] Generate Prisma client (`bunx prisma generate`)
- [ ] Create Prisma client instance (`src/lib/prisma.ts`)
- [ ] Test database connection
- [ ] Seed initial data (optional)

### Deliverables

- Database tables created in Supabase
- Prisma client ready to use

---

## Phase 3: Core API

### Goals

Implement REST endpoints for teams, sections, and tasks.

### Tasks

**Team Routes (`src/routes/teams.ts`)**

- [ ] `GET /api/v1/teams` - List all teams with sections and tasks
- [ ] `GET /api/v1/teams/:id` - Get single team with sections and tasks
- [ ] `POST /api/v1/teams` - Create team (admin)
- [ ] `PUT /api/v1/teams/:id` - Update team (admin)
- [ ] `DELETE /api/v1/teams/:id` - Delete team (admin)

**Section Routes (`src/routes/sections.ts`)**

- [ ] `POST /api/v1/teams/:teamId/sections` - Create section (admin)
- [ ] `PUT /api/v1/sections/:id` - Update section (admin)
- [ ] `DELETE /api/v1/sections/:id` - Delete section (admin)

**Task Routes (`src/routes/tasks.ts`)**

- [ ] `POST /api/v1/sections/:sectionId/tasks` - Create task (admin)
- [ ] `PUT /api/v1/tasks/:id` - Update task (admin)
- [ ] `DELETE /api/v1/tasks/:id` - Delete task (admin)
- [ ] `PATCH /api/v1/tasks/:id/toggle` - Toggle task completion (public)

**Services**

- [ ] `src/services/team.service.ts`
- [ ] `src/services/section.service.ts`
- [ ] `src/services/task.service.ts`

**Validation**

- [ ] Create Zod schemas for request validation
- [ ] Apply validation middleware to routes

### Deliverables

- All CRUD endpoints working
- Input validation on all endpoints

---

## Phase 4: Authentication

### Goals

Implement Supabase JWT authentication for admin endpoints.

### Tasks

- [ ] Configure Supabase environment variables
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_JWT_SECRET`
- [ ] Create Supabase client (`src/lib/supabase.ts`)
- [ ] Create auth middleware (`src/middleware/auth.ts`)
  - [ ] Extract JWT from `Authorization` header
  - [ ] Validate JWT with Supabase
  - [ ] Return 401 if invalid
- [ ] Apply auth middleware to admin routes
  - [ ] `POST`, `PUT`, `DELETE` on teams
  - [ ] `POST`, `PUT`, `DELETE` on sections
  - [ ] `POST`, `PUT`, `DELETE` on tasks
- [ ] Test authenticated endpoints
- [ ] Test unauthorized access returns 401

### Deliverables

- Admin routes protected with JWT authentication
- Public routes remain accessible

---

## Phase 5: WebSocket

### Goals

Implement real-time updates for task toggle events.

### Tasks

- [ ] Create WebSocket manager (`src/ws/manager.ts`)
  - [ ] Track connected clients
  - [ ] Handle connection/disconnection
  - [ ] Broadcast method for sending to all clients
- [ ] Setup WebSocket upgrade endpoint (`/ws`)
- [ ] Integrate WebSocket with Hono
- [ ] Broadcast `task:toggled` event when task is toggled
  - [ ] Payload: `{ taskId, completed }`
- [ ] Handle client reconnection gracefully
- [ ] Test with multiple clients

### Deliverables

- WebSocket connection on `ws://localhost:3000/ws`
- All clients receive `task:toggled` event in real-time

---

## Phase 6: Testing

### Goals

Implement unit and integration tests.

### Tasks

**Setup**

- [ ] Configure Bun test runner
- [ ] Create test utilities (mock Prisma, test client)
- [ ] Setup test database (or mock)

**Unit Tests**

- [ ] `team.service.test.ts`
- [ ] `section.service.test.ts`
- [ ] `task.service.test.ts`

**Integration Tests**

- [ ] Team endpoints (`routes/teams.test.ts`)
- [ ] Section endpoints (`routes/sections.test.ts`)
- [ ] Task endpoints (`routes/tasks.test.ts`)
- [ ] Auth middleware (`middleware/auth.test.ts`)

**WebSocket Tests**

- [ ] Connection test
- [ ] Broadcast test (`tests/integration/ws.test.ts`)

**Scripts**

- [ ] Add `test` script to `package.json`
- [ ] Add `test:watch` script
- [ ] Add `test:coverage` script

### Deliverables

- All tests passing
- Test coverage report available

---

## Phase 7: Docker

### Goals

Containerize the application for deployment.

### Tasks

- [ ] Create `Dockerfile`
  - [ ] Multi-stage build (deps, build, production)
  - [ ] Use `oven/bun:1` base image
  - [ ] Generate Prisma client in build stage
  - [ ] Expose port 3000
- [ ] Create `.dockerignore`
- [ ] Create `docker-compose.yml` for local development
- [ ] Test Docker build (`docker build -t rvvr-checklist-backend .`)
- [ ] Test Docker run (`docker run -p 3000:3000 rvvr-checklist-backend`)
- [ ] Document Docker commands in README

### Deliverables

- Working Docker image
- docker-compose for local development

---

## Phase 8: Deployment (AWS)

### Goals

Deploy the application to AWS.

### Tasks

- [ ] Choose AWS service (TBD: ECS, App Runner, EC2, or Lambda)
- [ ] Configure AWS infrastructure (TBD)
- [ ] Setup CI/CD pipeline (TBD)
- [ ] Configure environment variables in AWS (TBD)
- [ ] Setup domain and SSL (TBD)
- [ ] Configure WebSocket support (TBD)
- [ ] Setup monitoring and logging (TBD)

### Deliverables

- TBD
