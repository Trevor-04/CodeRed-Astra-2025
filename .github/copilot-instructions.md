<!--
Guidance for AI coding agents working on CodeRed-Astra-2025.
Keep this file concise and actionable. Only include changes that are discoverable in the repo.
-->

# Copilot instructions for CodeRed-Astra-2025

Overview
- This repository contains three collaborating services:
  - `frontend/` — React + Vite + Tailwind app (TypeScript). Entry: `src/main.tsx`, run with `npm run dev` in `frontend`.
  - `backend/` — Node.js + Express API. Entry: `server.js`. Scripts: `npm run dev` (uses `nodemon`) and `npm start`.
  - `ai/` — FastAPI service using Google Gemini (`google-generativeai`) in `ai/main.py`. Run with `uvicorn main:app --reload` after creating a Python venv and installing `ai/requirements.txt`.

Quick goals for changes
- Preserve accessibility-first design (project README emphasizes keyboard navigation, screen reader support, high-contrast, dyslexia features).
- Do not change API surface without updating `backend/server.js` routes and README endpoint docs.

Important files to reference
- `README.md` — high-level architecture and setup.
- `backend/server.js` — main Express app and endpoints. Example: `/api/health`.
- `backend/package.json` — run scripts: `dev` (nodemon), `start`.
- `frontend/package.json` — run scripts: `dev`, `build`, `preview`, `lint`.
- `ai/main.py` and `ai/requirements.txt` — the AI service, Gemini configuration uses `GEMINI_API_KEY` via `.env`.

Developer workflows & commands
- Frontend dev: cd `frontend` -> `npm install` -> `npm run dev` (Vite at default 5173).
- Backend dev: cd `backend` -> `npm install` -> `npm run dev` (nodemon, default port 3000). Health: `GET /api/health`.
- AI service: cd `ai` -> create venv and activate -> `pip install -r requirements.txt` -> set `GEMINI_API_KEY` in `.env` -> `uvicorn main:app --reload` (port 8000).

Environment and secrets
- `.env` files are used in both `backend` and `ai`. Known keys:
  - Backend: `PORT`, `SUPABASE_URL`, `SUPABASE_KEY`, `NODE_ENV`.
  - AI: `GEMINI_API_KEY`.
- Never hardcode secrets; prefer `.env` and platform-specific secret stores. If adding new env keys, update `README.md` and relevant code that reads `process.env` or `os.getenv`.

Conventions and patterns seen in this repo
- Minimal API surfaces: `backend/server.js` exposes small, explicit routes; prefer small, testable functions when adding new endpoints.
- Error handling: the backend returns structured JSON errors (see 404 and error handler in `server.js`). Follow the same shape when adding errors.
- CORS: both backend and AI allow broad origins in dev. When modifying, prefer narrowing origins and document change in README.
- Type/JS module style: `backend` uses ES modules (`type: "module"` in `package.json`), so use `import`/`export` consistently.

Integration points
- Frontend <-> Backend: frontend calls backend API at `http://localhost:3000` in dev (ensure paths match `server.js` routes).
- Frontend <-> AI: AI service runs separately on `http://localhost:8000` (FastAPI). Use `/models`, `/health`, `/docs` as discovery endpoints.
- Backend <-> Supabase: backend includes `@supabase/supabase-js` in dependencies. When adding DB code, initialize the client using `SUPABASE_URL`/`SUPABASE_KEY` from env.

When making edits
- Small changes: run the affected service locally and ensure the corresponding health endpoint responds.
  - Backend smoke test: after start, GET `http://localhost:3000/api/health` returns JSON with `status: "OK"`.
  - AI smoke test: after start, GET `http://localhost:8000/health` returns `gemini: "configured"` or `not_configured`.
- Adding endpoints: update README.md API section and add tests or simple manual verification instructions.
- Dependency changes: update `package.json` or `requirements.txt` and keep lockfiles in sync; ensure `frontend` build still runs (`npm run build`).

Examples from the codebase
- Add a new backend route: follow pattern in `server.js`: use `app.get('/path', handler)` and throw appropriate JSON errors on unknown routes. Use `express.json()` middleware for request bodies.
- Use of Gemini in `ai/main.py`: `genai.configure(api_key=GEMINI_API_KEY)` is used at startup. If you need to call model APIs, follow the existing `list_models` example.

Limitations (what the repo does not contain)
- No automated tests present. Do not assume CI/test harnesses exist; changes to critical flows should be smoke-tested locally and documented.
- No existing `.github` agent rules to merge; this file is the initial guidance.

If unsure, prefer conservative changes
- Keep backward compatibility for public endpoints and environment variables.
- Document breaking changes in `README.md` and this file.

If you edit this file
- Keep it short and focused. Update examples and referenced files when you change behavior.

— End of instructions —
