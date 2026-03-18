# Backend

Minimal shared backend scaffold for the Neighborhood Emergency Preparedness Hub.

## Scope

This is a light initialization layer so the backend subgroup can start from the same structure before splitting implementation work.

Current module split:

- `src/modules/auth` - registration, login, email verification
- `src/modules/profiles` - profile, privacy, health, location
- `src/modules/help-requests` - request creation and tracking
- `src/modules/availability` - volunteer availability and assignment flow

## Run locally

1. Copy `backend/.env.example` to `backend/.env`
2. Install dependencies with `npm install`
3. Start the server with `npm run dev`

The server exposes:

- `GET /health`
- `GET /api`
- `GET /api/auth`
- `GET /api/profiles`
- `GET /api/help-requests`
- `GET /api/availability`

## Database note

The shared PostgreSQL schema already lives in `infra/docker/postgres/init.sql`. This scaffold only prepares configuration and a reusable DB pool helper without implementing feature logic yet.
