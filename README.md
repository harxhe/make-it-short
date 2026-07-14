# MakeItShort

A high-scale URL shortener monorepo optimized for read-heavy traffic. Built as an exploration into scalable system design architecture.

## System Architecture Highlights

- **Distributed ID Generation:** Utilizes Twitter's Snowflake algorithm to generate unique, collision-free, and time-sortable short IDs at scale.
- **High-Performance Caching:** Integrates Redis to cache frequently accessed URLs, ensuring lightning-fast redirections and reduced database load.
- **Persistent Storage:** Uses PostgreSQL for reliable and durable storage of URL mappings.

## Structure

```text
.
|-- backend/
|-- frontend/
|-- infra/
`-- package.json
```

## Quick Start

1. Copy `.env.example` to `.env` and update values.
   - For Supabase, set either `SUPABASE_DATABASE_URL` or all `SUPABASE_DB_*` values.
   - For Upstash, set `REDIS_URL` to your `rediss://` connection string.
2. (Optional) Start local dependencies: `npm run infra:up`
3. Run both backend and frontend concurrently: `npm run dev`

Alternatively, run them individually:
- Backend: `npm run backend:run`
- Frontend: `npm run frontend:dev`

## Tech Stack

- **Backend:** Go + chi router
- **Frontend:** React + Vite + TypeScript
- **Database:** Supabase (PostgreSQL)
- **Cache:** Upstash (Redis)
- **ID Generation:** Snowflake Algorithm
- **Deployment:** Render (Backend) / Vercel (Frontend)
