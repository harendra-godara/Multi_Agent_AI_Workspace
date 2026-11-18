# Multi-Agent AI Workspace — Backend

Node.js / Express / PostgreSQL backend containing two services:

- **Identity & Access Service** — registration, login, JWT sessions (revocable), logout.
- **Workspace & Task Service** — workspaces, members and invites, tasks, task dependencies, workflow runs.

The AI Agent Service and Execution & Artifact Service are separate services (teammates). This backend talks to them through the contract in [Integration contract](#integration-contract).

## Requirements

- Node.js 20+ (tested on 22)
- PostgreSQL 14+
- `curl` and `jq` for `smoke_test.sh`

## Setup

```bash
npm install

# 1. database (run once, as a PostgreSQL superuser)
#    CREATE USER app_user WITH PASSWORD '...';
#    CREATE DATABASE myapp_db OWNER app_user;
psql "$DATABASE_URL" -f src/db/schema.sql
psql "$DATABASE_URL" -f src/db/migrations/001_constraints.sql   # optional hardening

# 2. configuration: create .env (never commit it)
```

`.env`:

| Variable | Required | Meaning |
|---|---|---|
| `DATABASE_URL` | yes | e.g. `postgresql://app_user:password@localhost:5432/myapp_db` |
| `JWT_SECRET` | yes | long random string used to sign tokens |
| `SERVICE_API_KEY` | yes | shared secret for service-to-service calls (`X-Service-Key`). Generate with `openssl rand -hex 24` |
| `PORT` | no | default `5000` |
| `AGENT_SERVICE_URL` | no | base URL of the AI Agent Service. If unset, runs stay `running` until a service reports back |

```bash
npm start            # node server.js
npm test             # automated API tests (needs the database + env vars above)
npm run smoke        # curl-based end-to-end check against a running server
```

## Try the whole flow without the teammates' services

```bash
# terminal 1 – fake agent service (port 7001)
SERVICE_API_KEY=<same as .env> BACKEND_URL=http://localhost:5000 npm run mock-agent

# terminal 2 – backend pointed at it
AGENT_SERVICE_URL=http://localhost:7001 npm start
```

Create a task, `POST /api/tasks/:id/run`, and ~2 seconds later the task becomes `completed`
(or `failed` if its title contains the word "fail").

> Do not run an agent service on a port that `fetch()` blocks by specification (for example 6000, 6665-6669, 4045, 5060, 10080): the backend would fail with `fetch failed: bad port`.

## API

Full reference: [`docs/openapi.yaml`](docs/openapi.yaml) (OpenAPI 3.0 — open it in Swagger Editor or import it into Postman).

All protected routes need `Authorization: Bearer <token>`. Errors are always `{ "message": "..." }`.

| Area | Endpoints |
|---|---|
| Auth | `POST /api/auth/register` · `login` · `logout` · `logout-all` · `GET /api/auth/me` |
| Workspaces | `POST/GET /api/workspaces` · `GET/PATCH/DELETE /api/workspaces/:id` · `POST /:id/leave` |
| Members | `GET /:id/members` · `POST /:id/invite` · `PATCH/DELETE /:id/members/:memberId` |
| Invites | `GET /api/invites` · `POST /api/invites/:id/accept` · `POST /api/invites/:id/decline` |
| Tasks | `POST/GET /api/workspaces/:id/tasks` (also `POST/GET /api/tasks` with `workspaceId`) · `GET/PATCH/DELETE /api/tasks/:taskId` |
| Dependencies | `GET/POST /api/tasks/:taskId/dependencies` · `DELETE …/dependencies/:dependsOnId` |
| Runs | `POST /api/tasks/:taskId/run` · `GET /api/tasks/:taskId/runs` · `GET /api/runs/:runId` · `PATCH /api/runs/:runId` (services) |

### Rules worth knowing

- **Roles:** `Owner` (creator, one per workspace), `Admin`, `Member`. Owner/Admin invite and remove; only the Owner changes roles or deletes the workspace.
- **404 vs 403:** a non-member gets `404` for a workspace or task so its existence is not revealed; `403` is used only when the caller is a member without the needed role.
- **Task status:** `pending → running → completed | failed`. `running` is reached only through `POST …/run`; `completed`/`failed` from a run only through the service callback. By hand a user may do `pending→completed`, `running→pending` (cancels the run), `failed→pending`, `completed→pending`. Anything else is `409`.
- **Dependencies:** a task cannot run until every task it depends on is `completed` (`409` with `blockedBy`). Self-dependencies and cycles (direct or indirect) are rejected with `409`.
- **One active run per task:** the task row is locked (`SELECT … FOR UPDATE`) while a run starts, so two simultaneous requests cannot both succeed.

## Integration contract

1. A user calls `POST /api/tasks/:id/run` → backend answers `202`, creates a run, sets the task to `running`.
2. Backend notifies the agent service:
   `POST {AGENT_SERVICE_URL}/runs` with header `X-Service-Key` and body
   `{ "runId", "taskId", "workspaceId", "title", "description" }`. Any non-2xx answer or timeout (5 s) marks the run and task `failed`.
3. When the work is done, the service reports back:
   `PATCH {BACKEND}/api/runs/:runId` with header `X-Service-Key` and body
   `{ "status": "completed" | "failed", "result": { ... } }`. A run can be finished only once (`409` afterwards).

`tools/mock-agent-service.js` implements both sides of this and is the reference for the real services.

## Project layout

```
server.js                     app setup, routes, error handling
src/config/db.js              PostgreSQL pool
src/db/schema.sql             tables;  migrations/  optional hardening
src/middleware/               verifyToken, workspaceAccess, taskAccess, serviceAuth, workspaceFromRequest
src/controllers/              auth, workspace, member, invitation, task, dependency, run
src/routes/                   auth, workspaces, invites, tasks, runs
src/services/agentClient.js   notifies the agent service
src/utils/                    sessions (token hashing / revoke), validators
tests/api.test.js             automated tests (node:test)
tools/mock-agent-service.js   fake agent service
smoke_test.sh                 curl end-to-end check
docs/openapi.yaml             API reference
```

## Security notes

- Passwords are hashed with bcrypt; tokens are JWTs with a unique `jti`; only a SHA-256 hash of each token is stored in `auth_sessions`, and every request checks that its session is neither revoked nor expired.
- All SQL is parameterized. UUID path parameters are validated before they reach PostgreSQL.
- `.env` must stay out of git (it is in `.gitignore`).
