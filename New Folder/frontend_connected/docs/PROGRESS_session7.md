
---

## Session 7 — Connecting the frontend to the backend

### 1. What was done

The React frontend (`frontend/`) was built against mock data (`DEMO_MODE = true` in `src/lib/api.js`). It now talks to the real backend:

- Register / login / **logout (token revoked on the server)**
- Workspaces: list, create, switch; a **default workspace is created on first login**
- **Pending invitations** on the Workspaces page (accept / decline) — the frontend had no way to accept an invite before
- Members list and invite, with real error messages (duplicate invite, not allowed...)
- Tasks: list, **"Run task" = create + run**, live status refresh until the agent service reports back
- `401` anywhere → session cleared → redirect to `/login`

Files: `src/lib/api.js` (rewritten), `src/lib/useTasks.js` (new), `src/lib/workspace.js`, pages `Dashboard`, `Tasks`, `Workspace`, `Members`, `Workspaces`, `Settings`, components `Topbar`, `WorkspaceSwitcher`, plus `.env.example` and `frontend/README.md`.

### 2. First step: compare what the frontend expects with what the backend offers

Before changing code I read every page and listed each call:

| Frontend expected | Backend has | Fix |
|---|---|---|
| `GET /tasks` (no workspace) | tasks live inside a workspace | send `?workspaceId=` using the current workspace |
| `POST /tasks {description}` | needs `workspaceId` + `title`, and a separate `/run` | build title from the first line (max 80 chars), keep the full text as description, then call `/run` |
| status labels `Queued / In review / Completed / Running` | `pending / running / completed / failed` | translate in one function (`STATUS_LABEL`); added a red `Failed` style |
| `time: "Today"` | `created_at` timestamp | `timeAgo()` helper |
| login/register give `token` | `{ token, user }` | works unchanged (the pages only read `token`) |
| `GET /agents` | does not exist (AI Agent Service) | stays static; no call is made |
| workspace id fallback `"ws-1"` | UUIDs only | `resolveWorkspaceId()` |

Lesson: integration is mostly this kind of table. Writing it first shows which side must change; here almost everything could be solved in the frontend's API layer, so the backend stayed untouched (the one backend addition was the flat `/api/tasks?workspaceId=` route from Session 6).

### 3. The demo-mode trap

`requestWithFallback` caught **every** error and silently returned mock data. With a real backend that means: wrong password → "logged in" with `demo-token`; "email already registered" → looks like success; a 403 → fake data. Mock fallbacks are fine for demos but dangerous once a backend exists, so demo mode is now opt-in (`VITE_DEMO_MODE=true`), and real server messages reach the UI. Also a network failure now says "Cannot reach the server. Is the backend running?" instead of a raw `TypeError: Failed to fetch`.

### 4. "Current workspace" and the double-click problem

Every task call needs a workspace id. `resolveWorkspaceId()` returns the saved id if the user is still a member, else the first workspace, else creates "My Workspace". React `StrictMode` runs effects twice in development, and the switcher and the page both ask on load — two simultaneous "no workspace yet" lookups would create **two** default workspaces. The function therefore shares one in-flight promise between concurrent callers (like two people asking the receptionist at the same moment: she answers both from one lookup). The test fires three concurrent calls and asserts exactly one workspace exists.

The switcher reloads the page (`window.location.assign`) after a switch, because pages read the workspace id when they load; a reload guarantees nothing shows the previous workspace's data.

### 5. Live status without WebSockets: polling

A run finishes later (the agent service calls back). `useTasks()` re-fetches every 3 seconds **only while at least one task is `running`**, and stops when none is, so an idle page makes no requests. Polling is the simplest way to see changes made elsewhere; WebSockets or Server-Sent Events would be the upgrade if many users watch many runs.

### 6. Expired or revoked tokens

Sessions are revocable (Session 6). If the user logs out in another tab, the next request returns `401`. `request()` handles this in one place: clear token and workspace id, redirect to `/login`. The exception is login/register themselves, where a `401` simply means "wrong password" and must be shown, not redirected.

### 7. CORS

The browser blocks a page on `localhost:5173` from reading responses of `localhost:5000` unless the backend sends `Access-Control-Allow-Origin`. The backend already uses `cors()` (allow all), which is fine for development; for production restrict it to the real frontend origin.

### 8. Testing

- `npm run lint` — clean (it was clean before too); `npm run build` — OK.
- The real `api.js` was bundled and run in Node against the real backend + the mock agent service (18 checks, all pass): register, wrong password, duplicate email, default workspace created once under concurrency, create + run, task `Running → Completed/Failed` after the agent callback, members, invite, duplicate invite, second user accepts the invite and sees the shared tasks, logout revokes the token, revoked token → redirect, agents list, demo-mode fallback.
- **Not tested:** clicking through the pages in a browser (no browser was available in the test environment). Please do a manual pass: register → create task → watch it complete → invite a second account → accept → log out.

### 9. Known gaps

- **Agents page / dashboard agent status / "Agent execution" and "Execution logs" panels** on the New workflow page are still static visuals — they need the AI Agent Service and Execution & Artifact Service.
- Dashboard cards are computed from tasks (Active, Completed, Failed, Total); the old "Agent runs" and "Artifacts" cards were hard-coded numbers and had no data source, so they were replaced. Artifacts come back when Anurag's service exists.
- No UI yet for: changing a member's role, removing a member / cancelling an invite, leaving or deleting a workspace, editing or deleting a task, task dependencies, and viewing a task's run result (`GET /api/tasks/:id` and `/runs` already return it).
- The task list shows the first 100 tasks (no pagination controls).
- The token is kept in `localStorage`, which JavaScript on the page can read (an XSS bug could steal it). `httpOnly` cookies are the stronger option, at the cost of CSRF handling.

### Status

✅ Frontend ↔ backend connected for auth, workspaces, members, invitations, tasks, runs
⏳ Agents, execution logs and artifacts (other services); extra management screens (see gaps)

## Glossary additions

- **CORS** — browser rule: a page may read another origin's responses only if that server allows it with headers.
- **Polling** — asking the server again every few seconds to see if something changed.
- **In-flight promise sharing** — concurrent callers reuse one pending request instead of starting duplicates.
- **StrictMode (React)** — in development it runs effects twice to expose side-effect bugs.
- **Demo / mock mode** — fake data used instead of a server; must never hide real errors.
