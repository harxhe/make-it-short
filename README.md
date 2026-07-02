# MakeItShort

High-scale URL shortener monorepo optimized for read-heavy traffic.

## Structure

```text
.
|-- backend/
|-- frontend/
|-- infra/
`-- Makefile
```

## Quick Start

1. Copy `.env.example` to `.env` and update values.
   - For Supabase, set either `SUPABASE_DATABASE_URL` or all `SUPABASE_DB_*` values.
   - For Upstash, set `REDIS_URL` to your `rediss://` connection string.
2. (Optional) Start local dependencies: `make infra-up`.
3. Run backend from repo root: `make backend-run`.
4. Run frontend from repo root: `make frontend-dev`.

## Tech Stack

- Backend: Go + chi
- Frontend: React + Vite + TypeScript
- Database: Supabase Postgres
- Cache: Upstash Redis
- Deployment: Render
