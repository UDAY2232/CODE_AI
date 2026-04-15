# CODE_AI

Full-stack web application with a React + Vite frontend and a Node.js + Express backend.

## Tech Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- Backend: Node.js, Express
- Database/Platform integrations: Supabase

## Project Structure

- `frontend/` - client application
- `backend/` - API server and Supabase functions/migrations

## Prerequisites

- Node.js 18+
- npm 9+

## Local Development

### 1) Install dependencies

```bash
npm --prefix backend install
npm --prefix frontend install
```

### 2) Run backend

```bash
npm --prefix backend run dev
```

### 3) Run frontend

```bash
npm --prefix frontend run dev
```

## Build Frontend

```bash
npm --prefix frontend run build
```

## Notes

- Keep environment variables in `backend/.env` and `frontend/.env`.
- Avoid committing sensitive credentials.

## License

Add your preferred license information here.
