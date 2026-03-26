# Backend API

Minimal Node.js + Express backend designed to securely funnel data between the frontend clients and PostgreSQL.

**Team:** Rojhat Delibaş, Mehmet Can Gürbüz, Alper Kartkaya, Berat Sayın

## Core Modules (MVP)
The backend is split into independent domains to allow the team to work concurrently:
- **`auth/`** - JWT generation, email verification, passwords.
- **`profiles/`** - Physical, health, and privacy data management.
- **`help-requests/`** - Creation, resolution, and local sync state management.
- **`availability/`** - Tracking volunteer statuses and resolving assignments.

## Design Pattern
Every new module must strictly follow this 4-layer separation:
1. `routes.js`: Defines Express API endpoints.
2. `controller.js`: Handles HTTP requests, calls the service, and sends responses.
3. `service.js`: Contains pure business logic.
4. `repository.js`: The ONLY file allowed to execute SQL queries.

## API Conventions
- **Errors:** `{ "code": "SOME_ERROR", "message": "Human readable message" }`
- **Protected Routes:** Ensure you extract identity natively from `req.user.userId`.
- **Naming:** Kebab-case URLs (`/api/help-requests`).

## Setup
```bash
cp .env.example .env
npm install
npm run dev
```
*Be sure to set `POSTGRES_HOST=localhost` in your `.env` if running the DB locally via Docker.*
