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
2. Start local dependencies: `make infra-up`.
3. Run backend from repo root: `make backend-run`.
4. Run frontend from repo root: `make frontend-dev`.

## Tech Stack

- Backend: Go + chi
- Frontend: React + Vite + TypeScript
- Database: Supabase Postgres
- Cache: Upstash Redis
- Deployment: Render
