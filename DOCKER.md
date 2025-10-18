# Docker Setup Guide

This guide explains how to build and run the entire CodeRed Astra 2025 stack using Docker Compose.

## Prerequisites

- Docker installed: [Get Docker](https://docs.docker.com/get-docker/)
- Docker Compose installed (comes with Docker Desktop)

## Services

- **frontend**: React + Vite + TailwindCSS (port 5173)
- **backend**: Node.js + Express (port 3000)
- **ai**: FastAPI + Gemini (port 8000)
- **supabase-db**: Supabase Postgres (port 5432)

- ## Run Backend
 ```
docker compose build backend
docker compose up backend
```

## Environment Variables

Create a `.env` file in the project root with the following (replace with your actual keys):

```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
```

## Build and Run All Services

1. Open a terminal in the project root (`hackathon` folder).
2. Run:

```powershell
# Build all images and start all containers
# (use 'docker compose' or 'docker-compose' depending on your Docker version)
docker compose up --build
```

This will:

- Build Docker images for frontend, backend, and ai services
- Start all containers, including Supabase database

## Accessing the Services

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **AI Service**: http://localhost:8000
- **Supabase DB**: localhost:5432 (Postgres)

## Stopping All Services

```powershell
docker compose down
```

## Notes

- Code changes in `frontend`, `backend`, or `ai` folders will be reflected automatically (volumes are mounted).
- For production, update environment variables and Dockerfiles as needed.
- Supabase is running as a local Postgres instance. For full Supabase features, use the official Supabase platform.

---

For troubleshooting, check container logs:

```powershell
docker compose logs <service>
```

Replace `<service>` with `frontend`, `backend`, `ai`, or `supabase-db`.
