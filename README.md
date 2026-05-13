<div align="center">

# TenantOps

**A production-ready, full-stack Multi-Tenant SaaS Platform**

[![NestJS](https://img.shields.io/badge/NestJS-10-E0234E?logo=nestjs)](https://nestjs.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis)](https://redis.io/)
[![pnpm](https://img.shields.io/badge/pnpm-monorepo-F69220?logo=pnpm)](https://pnpm.io/)
[![Turborepo](https://img.shields.io/badge/Turborepo-powered-EF4444?logo=turborepo)](https://turborepo.dev/)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker)](https://www.docker.com/)

*A complete SaaS boilerplate featuring schema-per-tenant multi-tenancy, RBAC, Clerk authentication, Stripe billing, real-time notifications, project management features and more — all in a pnpm monorepo.*

</div>

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
  - [High-Level System Architecture](#high-level-system-architecture)
  - [Monorepo Structure](#monorepo-structure)
  - [API Module Architecture](#api-module-architecture)
  - [Multi-Tenancy Strategy](#multi-tenancy-strategy)
  - [Request Lifecycle](#request-lifecycle)
  - [Authentication & Authorization Flow](#authentication--authorization-flow)
  - [Caching Strategy](#caching-strategy)
  - [Database Schema](#database-schema)
- [Tech Stack](#tech-stack)
- [Feature Overview](#feature-overview)
- [Project Structure](#project-structure)
- [API Modules Deep Dive](#api-modules-deep-dive)
- [Frontend Architecture](#frontend-architecture)
- [Infrastructure & DevOps](#infrastructure--devops)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [API Reference](#api-reference)

---

## Overview

**TenantOps** is a full-stack, multi-tenant SaaS platform demonstrating enterprise-grade software architecture patterns. It solves the core problem of **tenant isolation** — where multiple organizations (tenants) share the same application infrastructure but have completely isolated data.

**Key Concepts:**

| Concept | Implementation |
|---|---|
| Multi-Tenancy | Schema-per-tenant in PostgreSQL |
| Authentication | Clerk (JWT-based, external identity provider) |
| Authorization | Role-Based Access Control (RBAC) with 4 roles |
| Billing | Stripe subscriptions with 3-tier plans |
| Caching | Redis with typed keys and TTL management |
| Error Handling | Railway-oriented programming with `neverthrow` |
| Code Quality | Biome (linter + formatter), TypeScript strict mode |

---

## Architecture

### High-Level System Architecture

```mermaid
graph TB
    subgraph Client["Client Layer"]
        Browser["Browser\n(React 19 + Vite)"]
    end

    subgraph External["External Services"]
        Clerk["Clerk\n(Identity Provider)"]
        Stripe["Stripe\n(Payment Gateway)"]
    end

    subgraph Gateway["Gateway Layer"]
        Nginx["Nginx\nReverse Proxy\n(Rate Limiting, Security Headers, Gzip)"]
    end

    subgraph API["API Layer — NestJS 10"]
        direction TB
        TenantMW["TenantMiddleware\n(x-org-id header resolution)"]
        RateMW["RateLimiterMiddleware\n(Redis-backed)"]
        Guards["RolesGuard\n(RBAC enforcement)"]
        Modules["Feature Modules\n(Projects, Tasks, Issues,\nSprints, Members, Analytics...)"]
    end

    subgraph Data["Data Layer"]
        PG["PostgreSQL 15\n(Schema-per-tenant)"]
        Redis["Redis 7\n(Cache + Rate Limiting)"]
    end

    Browser -->|"HTTPS requests"| Nginx
    Browser -->|"Auth (JWT)"| Clerk
    Nginx -->|"proxy_pass :13000"| TenantMW
    TenantMW --> RateMW --> Guards --> Modules
    Modules -->|"TypeORM queries"| PG
    Modules -->|"ioredis"| Redis
    Modules -->|"Stripe SDK"| Stripe
    Clerk -->|"Webhooks (svix verified)"| API
    Stripe -->|"Webhooks"| API
```

---

### Monorepo Structure

```mermaid
graph LR
    Root["tenantops\n(pnpm workspace + Turborepo)"]

    Root --> Apps
    Root --> Packages

    subgraph Apps["apps/"]
        API["api/\nNestJS Backend\n:13000"]
        Web["web/\nReact + Vite\n:5173"]
        Docs["docs/\nNext.js Docs"]
    end

    subgraph Packages["packages/"]
        Contracts["contracts/\nShared API types"]
        Core["core/\nDomain base classes"]
        Shared["shared/\nUtility helpers"]
        Infra["infrastructure/\nDB/cache/auth adapters"]
        UI["ui/\nShared React components"]
        TSConfig["typescript-config/\nBase tsconfig files"]
        ESLint["eslint-config/\nShared ESLint rules"]
    end

    Web -.->|"imports"| Contracts
    Web -.->|"imports"| UI
    API -.->|"imports"| Contracts
    API -.->|"imports"| Core
```

---

### API Module Architecture

```mermaid
graph TB
    subgraph AppModule["AppModule (Root)"]
        direction TB
        Config["AppConfigModule\n(@nestjs/config)"]
        DB["DatabaseModule\n(TypeORM + PostgreSQL)"]
        Redis["RedisModule\n(ioredis)"]
        Audit["AuditModule\n(immutable audit logs)"]

        subgraph Feature["Feature Modules"]
            Auth["AuthModule\n(Clerk webhook sync)"]
            Onboarding["OnboardingModule\n(Tenant setup wizard)"]
            Tenant["TenantModule\n(Org resolution + schema DDL)"]
            Stripe["StripeModule\n(Billing + webhooks)"]
            Projects["ProjectsModule"]
            Tasks["TasksModule"]
            Sprints["SprintsModule"]
            Issues["IssuesModule\n(Bug Tracker)"]
            Members["MembersModule"]
            Comments["CommentsModule"]
            Notifications["NotificationsModule"]
            Activity["ActivityModule\n(Audit timeline)"]
            Analytics["AnalyticsModule\n(Metrics dashboard)"]
            Settings["SettingsModule"]
            Health["HealthModule"]
        end
    end

    Config --> DB --> Feature
    Redis --> Feature
    Audit --> Feature
```

---

### Multi-Tenancy Strategy

TenantOps uses the **schema-per-tenant** pattern. Each organization (tenant) gets its own isolated PostgreSQL schema, while the `public` schema holds global tables.

```mermaid
graph LR
    subgraph PostgreSQL["PostgreSQL Database"]
        subgraph Public["public schema (shared)"]
            Users["users\n(Clerk user sync)"]
            Tenants["tenants\n(org metadata + plan)"]
            Memberships["memberships\n(user-tenant-role)"]
            Invitations["invitations"]
            AuditLogs["audit_logs"]
        end

        subgraph TenantA["tenant_abc123 schema (Org A — isolated)"]
            A_Projects["projects"]
            A_Tasks["tasks"]
            A_Sprints["sprints"]
            A_Issues["issues"]
            A_Comments["comments"]
            A_Notifications["notifications"]
            A_Activity["activity_logs"]
        end

        subgraph TenantB["tenant_xyz789 schema (Org B — isolated)"]
            B_Projects["projects"]
            B_Tasks["tasks"]
            B_Sprints["sprints"]
            B_Issues["issues"]
        end
    end
```

**How it works:**
1. When a new org is created (via Clerk webhook), `TenantService` runs `CREATE SCHEMA tenant_<id>` and executes the full DDL to provision all tables inside.
2. Every API request carries an `x-org-id` header (the Clerk Org ID).
3. `TenantMiddleware` resolves the org ID → tenant record → schema name (cached in Redis at 1hr TTL).
4. Feature services scope raw queries to the correct schema via `SET search_path = tenant_<schema>`.

---

### Request Lifecycle

```mermaid
sequenceDiagram
    participant C as React Client
    participant N as Nginx
    participant TM as TenantMiddleware
    participant RL as RateLimiterMiddleware
    participant G as RolesGuard
    participant S as Feature Service
    participant R as Redis
    participant DB as PostgreSQL

    C->>N: HTTP Request\n(x-org-id, x-clerk-user-id headers)
    N->>TM: Forward request
    TM->>R: Check tenant cache (tenant:resolve:<orgId>)
    alt Cache miss
        TM->>DB: SELECT * FROM tenants WHERE clerk_org_id = ?
        TM->>R: SET tenant cache (TTL 3600s)
    end
    TM->>TM: Attach tenantId, schemaName, plan, membershipRole to req
    TM->>RL: Next middleware
    RL->>R: Check rate limit counter
    RL->>G: Pass if within limit
    G->>G: Check @Roles() decorator vs req.membershipRole
    G->>S: Invoke route handler
    S->>DB: SET search_path = tenant_schema\nExecute query
    S-->>C: JSON Response
```

---

### Authentication & Authorization Flow

```mermaid
flowchart TD
    A["User signs up / logs in\nvia Clerk hosted UI"] --> B["Clerk issues JWT + session"]
    B --> C["Frontend stores session\n(@clerk/clerk-react)"]
    C --> D["API request:\nAuthorization: Bearer JWT\nx-org-id: org_xxx\nx-clerk-user-id: user_xxx"]

    D --> E{TenantMiddleware}
    E -- "Invalid / missing org" --> F["400 / 404 response"]
    E -- "Tenant resolved" --> G{RolesGuard}
    G -- "Insufficient role" --> H["403 Forbidden"]
    G -- "Authorized" --> I["Route handler executes"]

    subgraph Webhooks["Clerk Webhooks (svix signature verified)"]
        W1["user.created → sync to users table"]
        W2["organization.created → create tenant + provision schema"]
        W3["organizationMembership.created → create membership record"]
        W4["organizationMembership.deleted → remove membership"]
    end

    subgraph Roles["RBAC Roles"]
        R1["VIEWER — read-only access"]
        R2["MEMBER — create/edit own resources"]
        R3["ADMIN — manage team and settings"]
        R4["OWNER — full control + billing"]
    end
```

---

### Caching Strategy

Redis is used for all hot-path data. All keys are defined via typed `CacheKey` factories and `CacheTTL` constants — no magic strings anywhere.

| Cache Key Pattern | TTL | Purpose |
|---|---|---|
| `tenant:resolve:<clerkOrgId>` | 3600s | Tenant lookup (most critical path) |
| `user:orgs:<userId>` | 1800s | User's organization list |
| `rbac:<tenantId>:<userId>` | 1800s | Role and permissions check |
| `projects:<tenantId>` | 600s | Project list per tenant |
| `project:<tenantId>:<projectId>` | 600s | Single project |
| `tasks:<tenantId>:<projectId>:<filter>` | 120s | Filtered task list |
| `sprint:active:<tenantId>:<projectId>` | 3600s | Current active sprint |
| `sprints:<tenantId>:<projectId>` | 300s | All sprints for a project |
| `issues:<tenantId>:<filterHash>` | 120s | Issue list |
| `analytics:<tenantId>:<queryHash>` | 300s | Analytics query results |
| `metric_summary:<tenantId>` | 120s | Dashboard metric summary |
| `unread_count:<tenantId>:<userId>` | 60s | Notification badge count |
| `notif_prefs:<tenantId>:<userId>` | 3600s | Notification preferences |
| `rate:<tenantId>` | sliding | Rate limit hit counter |

---

### Database Schema

```mermaid
erDiagram
    users {
        uuid id PK
        string clerk_user_id UK
        string email
        string name
        string avatar_url
        timestamp created_at
    }

    tenants {
        uuid id PK
        string clerk_org_id UK
        string name
        string schema_name UK
        string slug
        string plan
        timestamp onboarded_at
        timestamp created_at
    }

    memberships {
        uuid id PK
        uuid user_id FK
        uuid tenant_id FK
        string role
        timestamp created_at
    }

    invitations {
        uuid id PK
        uuid tenant_id FK
        string email
        string role
        string token
        timestamp expires_at
    }

    audit_logs {
        uuid id PK
        uuid tenant_id FK
        uuid actor_id FK
        string action
        string target_type
        uuid target_id
        jsonb metadata
        string ip_address
        timestamp created_at
    }

    users ||--o{ memberships : "belongs to many tenants"
    tenants ||--o{ memberships : "has many members"
    tenants ||--o{ invitations : "sends invitations"
    tenants ||--o{ audit_logs : "records actions"
```

> **Tenant-scoped tables** (per schema): `projects`, `tasks`, `sprints`, `issues`, `comments`, `activity_logs`, `notifications`, `notification_preferences`

---

## Tech Stack

### Backend (`apps/api`)

| Technology | Version | Role |
|---|---|---|
| **NestJS** | 10 | Application framework (modular DI, decorators, guards, middleware) |
| **TypeScript** | 5 | Type-safe development across the entire backend |
| **TypeORM** | 0.3 | ORM for PostgreSQL — entities for shared schema, raw queries for tenant schemas |
| **PostgreSQL** | 15 | Primary database with schema-per-tenant isolation |
| **Redis** | 7 | Caching layer and rate-limit counter store |
| **ioredis** | 5 | Redis client with typed wrapper |
| **Clerk** (`@clerk/backend`) | 3 | Authentication — JWT verification + webhook event processing |
| **Stripe** | 22 | Subscription billing and plan lifecycle management |
| **svix** | 1 | Webhook signature verification for Clerk events |
| **neverthrow** | 8 | Railway-oriented error handling — `Result<T, E>` instead of throw |
| **class-validator** | 0.14 | Declarative DTO validation via decorators |
| **class-transformer** | 0.5 | Request body transformation and serialization |
| **@nestjs/swagger** | 7 | Auto-generated OpenAPI 3.0 / Swagger UI documentation |
| **uuid** | 14 | UUID v4 generation for tenant-schema records |
| **Biome** | 1.5 | Ultra-fast linter and formatter (replaces ESLint + Prettier) |
| **Nodemon** | 3 | File-watch hot-reload in development |

### Frontend (`apps/web`)

| Technology | Version | Role |
|---|---|---|
| **React** | 19 | UI rendering with the latest concurrent features |
| **Vite** | 7 | Fast bundler and dev server |
| **TypeScript** | 5.9 | Type-safe frontend development |
| **@clerk/clerk-react** | 5 | Auth UI components, session hooks and token management |
| **TanStack Query** | 5 | Server state management — caching, background sync, optimistic updates |
| **React Router DOM** | 6 | Client-side routing and navigation |
| **MUI (Material UI)** | 9 | Accessible, feature-rich component library |
| **Tailwind CSS** | 4 | Utility-first CSS for custom layouts |
| **Framer Motion** | 12 | Declarative animations and transitions |
| **Recharts** | 3 | Composable chart library for analytics dashboards |
| **Axios** | 1.6 | HTTP client with interceptors for auth headers |
| **neverthrow** | 8 | Result-type error handling in the infrastructure layer |
| **Biome** | 1.5 | Linting and formatting |

### Infrastructure

| Technology | Role |
|---|---|
| **Docker** | Containerization of all services |
| **Docker Compose** | Multi-container orchestration for dev and production |
| **Nginx** | Production reverse proxy — routing, rate limiting, security headers, gzip |
| **pnpm Workspaces** | Monorepo package management with hoisting and workspace protocols |
| **Turborepo** | Monorepo build system with intelligent task caching and parallelism |

---

## Feature Overview

```mermaid
mindmap
  root((TenantOps))
    Auth and Identity
      Clerk OAuth and Email Auth
      JWT token verification
      Clerk webhook sync
      User profile management
    Multi-Tenancy
      Schema-per-tenant isolation
      Dynamic tenant provisioning
      Plan management
      Onboarding wizard
    Project Management
      Projects CRUD
      Kanban Board
      Backlog management
      Sprint planning
    Task Tracking
      Task status workflow
      Priority levels
      Assignees and reporters
      Labels and due dates
      Comments
    Bug Tracker
      Issue severity levels
      OPEN IN_PROGRESS RESOLVED
      Steps to reproduce
      Sprint linking
    Team Management
      Role-Based Access Control
      4 roles Owner Admin Member Viewer
      Member invitations via email
      Membership management
    Billing
      Stripe subscriptions
      3 plans Starter Pro Enterprise
      Checkout flow
      Webhook-driven plan updates
    Analytics
      Project metrics dashboard
      Sprint velocity tracking
      Team activity feed
      Query-hash-based cache
    Notifications
      In-app notifications
      Unread badge counting
      Per-category preferences
      Quiet hours support
    Audit and Compliance
      Immutable audit logs
      30+ action types recorded
      IP and user agent tracking
      Full audit trail API
    Infrastructure
      Redis caching layer
      Rate limiting per tenant
      Health check endpoint
      Swagger API documentation
```

---

## Project Structure

```
tenantops/
├── apps/
│   ├── api/                          # NestJS Backend (port 13000)
│   │   ├── src/
│   │   │   ├── main.ts               # Bootstrap — Swagger, CORS, global prefix
│   │   │   ├── app.module.ts         # Root module — wires all modules + middleware
│   │   │   ├── app.controller.ts     # GET / and GET /config
│   │   │   ├── config/
│   │   │   │   ├── configuration.ts  # All env vars as a typed config object
│   │   │   │   └── config.module.ts  # @nestjs/config registration
│   │   │   ├── common/
│   │   │   │   ├── errors/           # Typed domain errors (NotFoundError, AuthError, etc.)
│   │   │   │   ├── guards/           # RolesGuard — enforces @Roles() decorator
│   │   │   │   ├── helpers/          # Utility functions
│   │   │   │   ├── logger/           # Custom NestJS logger
│   │   │   │   ├── middleware/       # RateLimiterMiddleware (Redis-backed sliding window)
│   │   │   │   └── rbac/             # @Roles() decorator definition
│   │   │   ├── dto/                  # Shared DTOs (base, tenant, user)
│   │   │   └── modules/
│   │   │       ├── activity/         # Activity log viewer per tenant
│   │   │       ├── analytics/        # Aggregated metrics + reporting
│   │   │       ├── audit/            # Immutable audit trail (public schema)
│   │   │       ├── auth/             # Clerk webhook sync (users, orgs, memberships)
│   │   │       ├── comments/         # Task comments
│   │   │       ├── database/         # TypeORM async factory setup
│   │   │       ├── health/           # GET /health endpoint
│   │   │       ├── invitations/      # Email invitation system
│   │   │       ├── issues/           # Bug tracker module
│   │   │       ├── members/          # Team member management
│   │   │       ├── memberships/      # User-tenant relationship entity
│   │   │       ├── notifications/    # In-app notification system
│   │   │       ├── onboarding/       # Tenant onboarding wizard
│   │   │       ├── projects/         # Project CRUD
│   │   │       ├── redis/            # Redis service with typed CacheKey/CacheTTL
│   │   │       ├── settings/         # Tenant and user settings
│   │   │       ├── sprints/          # Sprint management
│   │   │       ├── stripe/           # Stripe billing + webhook handler
│   │   │       ├── tasks/            # Task CRUD + kanban board
│   │   │       ├── tenants/          # Tenant resolution + schema DDL provisioning
│   │   │       └── users/            # User entity + profile endpoints
│   │   ├── biome.json
│   │   ├── nodemon.json
│   │   └── tsconfig.json
│   │
│   ├── web/                          # React + Vite Frontend (port 5173)
│   │   └── src/
│   │       ├── main.tsx              # Entry point — ClerkProvider + QueryClientProvider
│   │       ├── pages/                # Route-level page components
│   │       │   ├── LandingPage.tsx
│   │       │   ├── DashboardPage.tsx
│   │       │   ├── ProjectsPage.tsx
│   │       │   ├── BoardPage.tsx         # Kanban board view
│   │       │   ├── BacklogPage.tsx       # Product backlog
│   │       │   ├── BugTrackerPage.tsx    # Issue tracker
│   │       │   ├── AnalyticsPage.tsx     # Metrics and charts
│   │       │   ├── TeamPage.tsx          # Members management
│   │       │   ├── SettingsPage.tsx
│   │       │   ├── OnboardingPage.tsx
│   │       │   ├── CheckoutSuccessPage.tsx
│   │       │   └── CheckoutCancelPage.tsx
│   │       ├── components/           # Reusable UI components
│   │       ├── application/          # Use-case / application layer (tenant/)
│   │       ├── infrastructure/       # API client adapters (Axios wrappers)
│   │       ├── presentation/         # View models + presenters
│   │       ├── core/                 # Pure domain models
│   │       ├── contexts/             # React Context providers
│   │       ├── hooks/                # Custom hooks wrapping TanStack Query
│   │       ├── lib/                  # Library wrappers and config
│   │       ├── config/               # App-level constants
│   │       └── types/                # TypeScript type definitions
│   │
│   └── docs/                         # Next.js documentation site
│
├── packages/
│   ├── contracts/        # Shared API response/request types (frontend + backend)
│   ├── core/             # Domain base classes and interfaces
│   ├── shared/           # Pure utilities (slugify, pagination helpers, etc.)
│   ├── infrastructure/   # Database, cache, and auth adapter interfaces
│   ├── ui/               # Shared React component library (Button, Card, Code)
│   ├── typescript-config/ # Shared tsconfig base files (base, nextjs, react-library)
│   └── eslint-config/    # Shared ESLint configurations (base, next, react-internal)
│
├── nginx/
│   └── nginx.conf        # Reverse proxy config with rate limiting and security headers
├── scripts/
│   ├── init-databases.sh # DB initialization helper script
│   └── init-schema.sql   # Base SQL for public schema
├── docker-compose.yml          # DB + Redis only (lightest local setup)
├── docker-compose.dev.yml      # Full dev environment (API + Web + DB + Redis)
├── docker-compose.prod.yml     # Production environment with Nginx
├── Dockerfile                  # Multi-stage build (development / builder / production)
├── turbo.json                  # Turborepo pipeline and caching config
├── pnpm-workspace.yaml         # Workspace package definitions
└── biome.json                  # Root Biome linter/formatter config
```

---

## API Modules Deep Dive

### `TenantModule` — The Core of Multi-Tenancy

The most critical module. Responsibilities:
- **Tenant resolution**: Maps Clerk `org_id` → `TenantEntity` with Redis caching (1hr TTL)
- **Membership validation**: Resolves the requesting user's role within the resolved tenant
- **Schema provisioning**: On first tenant creation, executes a full DDL block creating all tables in a new PostgreSQL schema (`tenant_<id>`)
- **Plan enforcement**: Attaches `tenant.plan` to the request for downstream feature-gating

All error cases use `neverthrow` `Result<T, E>` — no exceptions thrown.

### `AuthModule` — Clerk Webhook Sync

Listens to Clerk webhooks (signature verified via `svix`) to keep the local DB in sync:
- `user.created` / `user.updated` → upserts into the public `users` table
- `organization.created` → creates a `TenantEntity` and provisions the tenant schema + all DDL tables
- `organizationMembership.created` / `.deleted` → manages `MembershipEntity` records

### `StripeModule` — Subscription Billing

- Exposes checkout session creation for plan upgrades (Starter → Pro → Enterprise)
- Handles `checkout.session.completed` and `customer.subscription.updated` / `.deleted` webhooks
- Updates `tenant.plan` and stores Stripe customer/subscription IDs on the `TenantEntity`
- All billing events are recorded in `AuditLogs`

### `TasksModule` — Project Tasks

Core project management. All data is automatically scoped to the tenant schema via `SET search_path`:
- **Status flow**: `backlog → todo → in_progress → in_review → done`
- **Priority**: `low / medium / high / urgent`
- **Position**: integer column for drag-and-drop ordering on the Kanban board
- Sprint assignment, labels array, assignee, reporter, due dates

### `SprintsModule` — Sprint Planning

- Sprint lifecycle: `PLANNED → ACTIVE → COMPLETED`
- Auto-links tasks when a sprint is activated
- Active sprint cached in Redis (1hr TTL)
- Sprint start/end dates with `started_at` and `completed_at` timestamps

### `IssuesModule` — Bug Tracker

Separate from tasks — dedicated issue tracking:
- `type`: `BUG / TASK / FEATURE / IMPROVEMENT`
- `severity`: `LOW / MEDIUM / HIGH / CRITICAL`
- `status`: `OPEN / IN_PROGRESS / RESOLVED / CLOSED`
- `rank` (`DOUBLE PRECISION`) for fractional drag-to-reorder without re-ranking all rows
- Steps to reproduce field for bug reports

### `AuditModule` — Compliance & Traceability

Every significant mutation is recorded as an immutable log entry in the `public.audit_logs` table:
- Actor (user), action (30+ enum values), target type, target ID, metadata (JSONB)
- IP address and user agent captured from request
- Read-only; no update or delete operations exposed

### `AnalyticsModule` — Metrics Dashboard

Serves aggregated metrics for the analytics page:
- Task completion rates, open vs closed trends
- Sprint velocity and burn-down data
- Team activity breakdown
- Results cached with a query-hash key strategy (5min TTL); stale results serve instantly while Redis refreshes in background

### `NotificationsModule` — In-App Notifications

- Per-user notifications stored in the tenant schema
- Unread count cached in Redis (60s TTL), invalidated on new notification write
- Notification preferences: per-category email/in-app toggles
- Quiet hours: `quiet_hours_start` / `quiet_hours_end` stored as `HH:MM` strings

---

## Frontend Architecture

The frontend follows a **clean architecture** layered pattern to keep UI concerns separated from business logic and data fetching:

```
src/
├── core/           → Domain models (pure TypeScript classes, no React)
├── application/    → Use cases (orchestrate domain + infrastructure calls)
├── infrastructure/ → API HTTP adapters (Axios calls, neverthrow Results)
├── presentation/   → View models + presenters (shape data for UI rendering)
├── pages/          → Route-level components (thin shells, compose hooks + components)
├── components/     → Reusable React UI components
├── contexts/       → React Context providers (TenantContext, AuthContext)
└── hooks/          → Custom query hooks (wrap TanStack Query for each resource)
```

**Data Flow:**
```
Page Component
  → custom hook (useProjects, useTasks, useIssues...)
    → TanStack Query (cache + background refetch + stale-while-revalidate)
      → infrastructure API adapter (Axios + neverthrow Result<T, E>)
        → NestJS API (with x-org-id, Authorization headers via interceptor)
```

**Authentication in the browser:**
- `<ClerkProvider>` wraps the entire app
- `useAuth()` provides the session JWT, automatically refreshed by Clerk
- An Axios request interceptor attaches `Authorization: Bearer <token>`, `x-org-id`, and `x-clerk-user-id` headers to every outgoing request

**State Management:**
| Concern | Solution |
|---|---|
| Server / async data | TanStack Query v5 — auto-caching, background refetch, optimistic mutations |
| Local UI state | React `useState` / `useReducer` |
| Auth + tenant session | React Context (Clerk session + resolved tenant details) |
| Animations | Framer Motion declarative variants |

---

## Infrastructure & DevOps

### Docker Compose Environments

| File | Purpose | Services |
|---|---|---|
| `docker-compose.yml` | DB services only (lightest setup) | postgres, redis |
| `docker-compose.dev.yml` | Full dev environment with hot-reload | postgres, redis, api (volumes mounted), web |
| `docker-compose.prod.yml` | Production with Nginx | postgres, redis, api, web, nginx |

The development API container mounts `./apps/api` as a volume so Nodemon hot-reload works inside Docker.

### Nginx (Production Gateway)

```
                           ┌──────────────────────┐
Browser → port 80          │        Nginx          │
                           │                       │
  api.tenantops.local  →   │  rate: 10r/s (burst 20) │ → api:13000 (NestJS)
  tenantops.local      →   │  rate: 100r/s          │ → web:80  (React static)
                           │                       │
                           │  Headers:             │
                           │  X-Frame-Options      │
                           │  X-Content-Type-Options│
                           │  X-XSS-Protection     │
                           │  Gzip on              │
                           └──────────────────────┘
```

### Dockerfile (Multi-Stage)

```
Stage 1: base        — node:20-alpine + pnpm install --frozen-lockfile
Stage 2: development — mount volumes, expose port 13000, run nodemon
Stage 3: builder     — tsc compile to dist/
Stage 4: production  — copy dist/ only, node dist/main.js (minimal image)
```

### Turborepo Pipeline

```json
{
  "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
  "dev":   { "cache": false, "persistent": true },
  "lint":  { "dependsOn": ["^lint"] },
  "check": {}
}
```

Turborepo caches build outputs so unchanged packages are never rebuilt. Running `turbo build` only rebuilds packages that changed and their dependents.

---

## Getting Started

### Prerequisites

- **Node.js** 20+
- **pnpm** 9+ (`npm install -g pnpm`)
- **Docker** and **Docker Compose** v2

---

### Local Development

**1. Clone and install dependencies**

```bash
git clone <repo-url>
cd multi-tenant-SaaS-
pnpm install
```

**2. Configure environment variables**

```bash
pnpm env:setup
# Copies .env.example → .env for both apps
# Edit apps/api/.env and apps/web/.env with your real values
```

**3. Start databases**

```bash
docker compose up -d
# PostgreSQL → localhost:5438
# Redis      → localhost:6379
```

**4. Start the development servers**

```bash
pnpm dev
# API  → http://localhost:13000/api/v1
# Web  → http://localhost:5173
# Docs → http://localhost:13000/docs  (Swagger UI)
```

---

### Full Docker Development

Run the entire stack (API + Web + DB + Redis) inside Docker with hot-reload:

```bash
# Build and start all services
docker compose -f docker-compose.dev.yml up -d

# Follow all logs
docker compose -f docker-compose.dev.yml logs -f

# Shell into containers
docker exec -it tenantops-api-dev /bin/sh
docker exec -it tenantops-web-dev /bin/sh

# PostgreSQL interactive session
docker exec -it tenantops-postgres-dev psql -U tenantops -d tenantops_dev

# Redis CLI
docker exec -it tenantops-redis-dev redis-cli

# Stop (keep volumes)
docker compose -f docker-compose.dev.yml down

# Full wipe (remove volumes)
docker compose -f docker-compose.dev.yml down -v && docker system prune -af
```

---

### Production Deployment

```bash
# Build production images
docker compose -f docker-compose.prod.yml build

# Start in background
docker compose -f docker-compose.prod.yml up -d

# Stop
docker compose -f docker-compose.prod.yml down
```

---

## Environment Variables

### `apps/api/.env`

| Variable | Description | Default |
|---|---|---|
| `PORT` | API server port | `13000` |
| `NODE_ENV` | `development` or `production` | `development` |
| `DATABASE_URL` | PostgreSQL connection string — `postgresql://user:pass@host:port/db` | — |
| `DATABASE_MAX_CONNECTIONS` | TypeORM connection pool size | `10` |
| `REDIS_URL` | Redis URL | `redis://localhost:6379` |
| `REDIS_PASSWORD` | Redis password (optional) | — |
| `JWT_SECRET` | JWT signing secret | — |
| `JWT_EXPIRES_IN` | Token expiry | `7d` |
| `CLERK_SECRET_KEY` | Clerk backend secret (`sk_...`) | — |
| `CLERK_PUBLISHABLE_KEY` | Clerk publishable key (`pk_...`) | — |
| `CLERK_JWT_KEY` | Clerk JWT verification JWKS | — |
| `CLERK_WEBHOOK_SECRET` | svix webhook signing secret (`whsec_...`) | — |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_...`) | — |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret (`whsec_...`) | — |
| `APP_URL` | Frontend origin (used in links) | `http://localhost:5173` |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:5173` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in ms | `900000` (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window per tenant | `100` |
| `LOG_LEVEL` | Logging verbosity | `debug` |
| `ENABLE_REQUEST_LOGGING` | Log every HTTP request | `false` |

### `apps/web/.env`

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API base URL (e.g. `http://localhost:13000`) |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key for the browser |

---

## Available Scripts

Run from the **monorepo root**:

```bash
# ── Development ──────────────────────────────────────────────────────────────
pnpm dev                     # Start API + Web concurrently
pnpm dev:api                 # Start API only (:13000)
pnpm dev:web                 # Start Web only (:5173)

# ── Build ─────────────────────────────────────────────────────────────────────
pnpm build                   # Build API + Web
pnpm build:api
pnpm build:web

# ── Code Quality ──────────────────────────────────────────────────────────────
pnpm lint                    # Biome lint all apps
pnpm format                  # Biome format all apps (write)
pnpm check                   # Biome check (lint + format combined)

# ── Utilities ─────────────────────────────────────────────────────────────────
pnpm swagger                 # Generate TypeScript types from live OpenAPI spec
pnpm env:setup               # Copy .env.example → .env for both apps
pnpm clean                   # Delete all node_modules directories

# ── Docker: DB only ───────────────────────────────────────────────────────────
pnpm docker:db               # Start postgres + redis
pnpm docker:db-down          # Stop

# ── Docker: Full dev stack ────────────────────────────────────────────────────
pnpm docker:dev              # docker-compose.dev.yml up -d
pnpm docker:dev-down         # Stop dev stack
pnpm docker:dev-logs         # Follow logs
pnpm docker:dev-build        # Rebuild images --no-cache

# ── Docker: Production ────────────────────────────────────────────────────────
pnpm docker:prod             # docker-compose.prod.yml up -d
pnpm docker:prod-down
pnpm docker:prod-build

# ── Docker: Utility shells ────────────────────────────────────────────────────
pnpm docker:shell-api        # /bin/sh into tenantops-api-dev container
pnpm docker:shell-web        # /bin/sh into tenantops-web-dev container
pnpm docker:db-connect       # psql session in postgres container
pnpm docker:redis-cli        # Redis CLI in redis container
pnpm docker:clean            # Remove volumes + docker system prune -af
```

---

## API Reference

The full interactive Swagger UI is available at **`http://localhost:13000/docs`** when the server is running.

> **All tenant-scoped routes require three headers:**
> ```
> Authorization: Bearer <clerk_jwt>
> x-org-id: <clerk_org_id>
> x-clerk-user-id: <clerk_user_id>
> ```

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/` | — | Welcome message |
| `GET` | `/health` | — | Health check |
| `GET` | `/config` | — | API config info |
| `POST` | `/webhooks/clerk` | svix sig | Clerk webhook receiver |
| `POST` | `/stripe/webhook` | Stripe sig | Stripe webhook receiver |
| `POST` | `/orgs/mine` | JWT | Get caller's tenant list |
| `GET` | `/api/v1/tenants` | JWT + org | Tenant details |
| `POST` | `/api/v1/onboarding` | JWT + org | Complete onboarding wizard |
| `GET` | `/api/v1/projects` | JWT + org | List all projects |
| `POST` | `/api/v1/projects` | JWT + MEMBER | Create a project |
| `PATCH` | `/api/v1/projects/:id` | JWT + ADMIN | Update a project |
| `DELETE` | `/api/v1/projects/:id` | JWT + OWNER | Archive a project |
| `GET` | `/api/v1/tasks` | JWT + org | List tasks (filterable by sprint, status, assignee) |
| `POST` | `/api/v1/tasks` | JWT + MEMBER | Create a task |
| `PATCH` | `/api/v1/tasks/:id` | JWT + MEMBER | Update task (status, assignee, position…) |
| `DELETE` | `/api/v1/tasks/:id` | JWT + ADMIN | Delete a task |
| `GET` | `/api/v1/sprints` | JWT + org | List all sprints for a project |
| `POST` | `/api/v1/sprints` | JWT + ADMIN | Create a sprint |
| `PATCH` | `/api/v1/sprints/:id/start` | JWT + ADMIN | Start a sprint |
| `PATCH` | `/api/v1/sprints/:id/complete` | JWT + ADMIN | Complete a sprint |
| `GET` | `/api/v1/issues` | JWT + org | List issues (bug tracker) |
| `POST` | `/api/v1/issues` | JWT + MEMBER | Report an issue |
| `PATCH` | `/api/v1/issues/:id` | JWT + MEMBER | Update issue status / severity |
| `GET` | `/api/v1/comments` | JWT + org | Get comments for a task |
| `POST` | `/api/v1/comments` | JWT + MEMBER | Add a comment |
| `GET` | `/api/v1/members` | JWT + org | List all team members with roles |
| `POST` | `/api/v1/invitations` | JWT + ADMIN | Invite a new member by email |
| `DELETE` | `/api/v1/members/:id` | JWT + ADMIN | Remove a member |
| `GET` | `/api/v1/notifications` | JWT + org | Get in-app notifications |
| `PATCH` | `/api/v1/notifications/:id/read` | JWT + org | Mark notification as read |
| `GET` | `/api/v1/notifications/preferences` | JWT + org | Get notification preferences |
| `PATCH` | `/api/v1/notifications/preferences` | JWT + org | Update notification preferences |
| `GET` | `/api/v1/analytics` | JWT + org | Get project/sprint metrics |
| `GET` | `/api/v1/activity` | JWT + org | Get tenant activity feed |
| `GET` | `/api/v1/audit` | JWT + ADMIN | Get audit logs |
| `GET` | `/api/v1/settings` | JWT + org | Get settings |
| `PATCH` | `/api/v1/settings` | JWT + ADMIN | Update settings |

---

<div align="center">

Built with TypeScript · NestJS · React · PostgreSQL · Redis

</div>
