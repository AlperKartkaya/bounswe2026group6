# NEPH Web Portal

The React + Vite frontend serving the web-based administrative and public-facing flows.

## Scope
Currently covers:
- User signup and authentication.
- Private profile management (health, physical, and location data).
- General non-emergency administrative views.

## Quick Start
```bash
cp .env.example .env
npm install
npm run dev
```

## Networking Note
Vite is explicitly configured to proxy all `/api` requests directly to `http://localhost:3000`. You do not need to configure heavy cross-origin handling (CORS) locally.
