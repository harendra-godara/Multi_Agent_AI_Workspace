# AgentHub — Frontend

React 19 + Vite + Tailwind CSS 4 + React Router. It talks to the Express backend in `../backend`
(API reference: `../backend/docs/openapi.yaml`).

## Run the whole stack

```bash
# 1. backend (needs PostgreSQL + backend/.env, see backend/README.md)
cd backend && npm install && node server.js          # http://localhost:5000

# 2. frontend
cd frontend
cp .env.example .env                                  # only needed if the backend is not on localhost:5000
npm install
npm run dev                                           # http://localhost:5173
```

Optional, to see tasks finish without the teammates' services, run the fake agent service from the backend:

```bash
cd backend
SERVICE_API_KEY=<same as backend/.env> BACKEND_URL=http://localhost:5000 npm run mock-agent
# restart the backend with:  AGENT_SERVICE_URL=http://localhost:7001 node server.js
```

## Configuration (`.env`)

| Variable | Default | Meaning |
|---|---|---|
| `VITE_API_URL` | `http://localhost:5000/api` | Backend base URL (must end with `/api`) |
| `VITE_DEMO_MODE` | `false` | `true` = show mock data when the backend is unreachable (demo without a server) |

Demo mode is **off** by default: with it on, a wrong password or any server error would silently be replaced by mock data.

## How the UI maps to the backend

| Screen | Backend calls |
|---|---|
| Register / Login | `POST /api/auth/register`, `POST /api/auth/login` (token is kept in `localStorage`) |
| Log out (Topbar, Settings) | `POST /api/auth/logout` (revokes the token), then local cleanup |
| Workspaces, workspace switcher | `GET/POST /api/workspaces`; a default "My Workspace" is created on first login |
| Pending invitations (Workspaces page) | `GET /api/invites`, `POST /api/invites/:id/accept`, `…/decline` |
| Members | `GET /api/workspaces/:id/members`, `POST /api/workspaces/:id/invite` |
| Overview, Tasks, New workflow ("Run task") | `GET /api/tasks?workspaceId=`, `POST /api/tasks`, `POST /api/tasks/:id/run` |
| Agents | static list for now (the AI Agent Service has no endpoint yet) |

Task statuses are translated for the UI: `pending → Queued`, `running → Running`, `completed → Completed`, `failed → Failed`.
While any task is running, the task lists refresh every 3 seconds.

If the backend answers `401` (token expired or revoked), the app clears the session and redirects to `/login`.

## Scripts

`npm run dev` · `npm run build` · `npm run lint` · `npm run preview`
