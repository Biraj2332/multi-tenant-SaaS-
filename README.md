# TenantOps — Multi-Tenant SaaS Platform

A production-ready multi-tenant SaaS boilerplate built with **NestJS**, **React (Vite)**, **PostgreSQL**, and **Redis** in a **pnpm monorepo** powered by **Turborepo**.

## Stack

| Layer | Technology |
|---|---|
| API | NestJS 10, Swagger/OpenAPI |
| Web | React 19, Vite 7, TanStack Query |
| Auth | Clerk (JWT ready) |
| Database | PostgreSQL 15 (Prisma ready) |
| Cache | Redis 7 |
| Infra | Docker, Docker Compose, Nginx |
| Tooling | pnpm workspaces, Turborepo, Biome |

## Project Structure

```
.
├── apps/
│   ├── api/          # NestJS backend (port 13000)
│   └── web/          # React + Vite frontend (port 5173)
├── packages/
│   ├── contracts/    # Shared API types (frontend <-> backend)
│   ├── core/         # Domain base classes & errors
│   ├── shared/       # Utility helpers (slugify, pagination…)
│   ├── infrastructure/ # DB / cache / auth adapter interfaces
│   ├── ui/           # Shared React component library
│   ├── typescript-config/ # Shared tsconfig bases
│   └── eslint-config/     # Shared ESLint configs
├── nginx/            # Nginx reverse-proxy config
├── scripts/          # DB init scripts
├── docker-compose.yml          # DB + Redis only
├── docker-compose.dev.yml      # Full dev environment
└── docker-compose.prod.yml     # Production environment
```

## Quick Start (Local)

### 1. Prerequisites
- Node.js 20+, pnpm 9+
- Docker & Docker Compose

### 2. Install dependencies
```sh
pnpm install
```

### 3. Set up environment variables
```sh
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```
Edit both `.env` files with your real values.

### 4. Start databases
```sh
docker-compose up -d      # starts PostgreSQL + Redis
```

### 5. Run in development
```sh
pnpm dev                  # starts both api and web concurrently
```

- Frontend: http://localhost:5173  
- Backend API: http://localhost:13000/api/v1  
- Swagger Docs: http://localhost:13000/docs  

## Docker Development

Run the full stack (API + Web + DB + Redis) inside Docker:

```sh
make dev          # build & start
make dev-logs     # follow logs
make dev-down     # stop
```

Or without Make:
```sh
docker-compose -f docker-compose.dev.yml up -d
```

## Environment Variables

| File | Purpose |
|---|---|
| `apps/api/.env` | NestJS API config (port, DB URL, JWT, Clerk) |
| `apps/web/.env` | Vite frontend config (API URL, Clerk key) |
| `.env.docker` | Passed to Docker Compose services |

See `apps/api/.env.example` and `apps/web/.env.example` for all available variables.

## Available Scripts

```sh
pnpm dev              # Run api + web concurrently
pnpm build            # Build api + web
pnpm lint             # Lint all apps with Biome
pnpm format           # Format all apps with Biome
pnpm check            # Biome check (lint + format)
pnpm swagger          # Generate OpenAPI types from running API
pnpm docker:dev       # docker-compose.dev.yml up -d
pnpm docker:db        # docker-compose.yml up -d (DB only)
pnpm docker:clean     # Remove all dev containers + volumes
```

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/` | Welcome |
| GET | `/health` | Health check |
| GET | `/config` | API config info |
| GET | `/api/v1/tenants` | List tenants |
| GET | `/api/v1/users` | List users |
| GET | `/docs` | Swagger UI |

## Production

```sh
cp .env.docker .env.prod   # fill in real secrets
make prod-build
make prod-up
```

### Develop

To develop all apps and packages, run the following command:

```
cd my-turborepo

# With [global `turbo`](https://turborepo.dev/docs/getting-started/installation#global-installation) installed (recommended)
turbo dev

# Without [global `turbo`](https://turborepo.dev/docs/getting-started/installation#global-installation), use your package manager
npx turbo dev
yarn exec turbo dev
pnpm exec turbo dev
```

You can develop a specific package by using a [filter](https://turborepo.dev/docs/crafting-your-repository/running-tasks#using-filters):

```
# With [global `turbo`](https://turborepo.dev/docs/getting-started/installation#global-installation) installed (recommended)
turbo dev --filter=web

# Without [global `turbo`](https://turborepo.dev/docs/getting-started/installation#global-installation), use your package manager
npx turbo dev --filter=web
yarn exec turbo dev --filter=web
pnpm exec turbo dev --filter=web
```

### Remote Caching

> [!TIP]
> Vercel Remote Cache is free for all plans. Get started today at [vercel.com](https://vercel.com/signup?/signup?utm_source=remote-cache-sdk&utm_campaign=free_remote_cache).

Turborepo can use a technique known as [Remote Caching](https://turborepo.dev/docs/core-concepts/remote-caching) to share cache artifacts across machines, enabling you to share build caches with your team and CI/CD pipelines.

By default, Turborepo will cache locally. To enable Remote Caching you will need an account with Vercel. If you don't have an account you can [create one](https://vercel.com/signup?utm_source=turborepo-examples), then enter the following commands:

```
cd my-turborepo

# With [global `turbo`](https://turborepo.dev/docs/getting-started/installation#global-installation) installed (recommended)
turbo login

# Without [global `turbo`](https://turborepo.dev/docs/getting-started/installation#global-installation), use your package manager
npx turbo login
yarn exec turbo login
pnpm exec turbo login
```

This will authenticate the Turborepo CLI with your [Vercel account](https://vercel.com/docs/concepts/personal-accounts/overview).

Next, you can link your Turborepo to your Remote Cache by running the following command from the root of your Turborepo:

```
# With [global `turbo`](https://turborepo.dev/docs/getting-started/installation#global-installation) installed (recommended)
turbo link

# Without [global `turbo`](https://turborepo.dev/docs/getting-started/installation#global-installation), use your package manager
npx turbo link
yarn exec turbo link
pnpm exec turbo link
```

# Option 3 — Separate terminals
pnpm install
docker compose up -d              # DB only (port 5438 + 6379)
cd apps/api && pnpm dev           # Terminal 1 → :13000
cd apps/web && pnpm dev           # Terminal 2 → :5173

# Option 2 — Full Docker
docker compose -f docker-compose.dev.yml up -d

## Useful Links

Learn more about the power of Turborepo:

- [Tasks](https://turborepo.dev/docs/crafting-your-repository/running-tasks)
- [Caching](https://turborepo.dev/docs/crafting-your-repository/caching)
- [Remote Caching](https://turborepo.dev/docs/core-concepts/remote-caching)
- [Filtering](https://turborepo.dev/docs/crafting-your-repository/running-tasks#using-filters)
- [Configuration Options](https://turborepo.dev/docs/reference/configuration)
- [CLI Usage](https://turborepo.dev/docs/reference/command-line-reference)


