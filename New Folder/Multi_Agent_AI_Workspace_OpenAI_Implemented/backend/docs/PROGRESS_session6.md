
---

## Session 6 — Completing the backend (sessions, workspace management, tasks, dependencies, runs)

### 1. What was built

- **Sessions:** `POST /api/auth/logout`, `POST /api/auth/logout-all`. `auth_sessions` is now really used: every login/register stores a SHA-256 hash of the token, and `verifyToken` rejects revoked or expired sessions.
- **Workspaces:** `GET /api/workspaces/:id`, `PATCH` (Owner/Admin), `DELETE` (Owner), `POST /:id/leave`.
- **Members & invites:** `PATCH /:id/members/:memberId` (Owner changes role), `DELETE /:id/members/:memberId` (remove a member *or* cancel a pending invite), `POST /api/invites/:id/decline`.
- **Tasks:** `POST/GET /api/workspaces/:id/tasks` (+ flat `POST/GET /api/tasks` with `workspaceId`), `GET/PATCH/DELETE /api/tasks/:taskId`, filters `?status=&limit=&offset=`.
- **Dependencies:** `GET/POST /api/tasks/:taskId/dependencies`, `DELETE …/dependencies/:dependsOnId`.
- **Runs:** `POST /api/tasks/:taskId/run` (202), `GET /api/tasks/:taskId/runs`, `GET /api/runs/:runId`, `PATCH /api/runs/:runId` (service callback).
- **Cross-cutting:** JSON 404 handler, malformed-JSON → `400`, input validation everywhere, `README.md`, `docs/openapi.yaml`, `tests/api.test.js`, `smoke_test.sh`, `tools/mock-agent-service.js`.

### 2. Task status is a small state machine

```
pending ──/run──▶ running ──callback──▶ completed
   ▲                 │  └─────callback──▶ failed
   └──── by hand ────┘ (cancel)        failed/completed ──by hand──▶ pending
```

Think of a train ticket: it can be *booked → used*, but you cannot jump from *booked* straight to *refunded after use*. The server owns the rules, so the client cannot invent illegal transitions. Illegal change → `409 Conflict` (the request is well-formed, but the *current state* forbids it).

- `running` can only be reached through `/run` (that is what creates the `workflow_runs` row).
- `completed`/`failed` coming from a run can only be set by a service holding the service key.
- Cancelling a running task by hand marks its active run `cancelled`, so a run is never left dangling.

### 3. Two users pressing "Run" at the same time (locking)

Check-then-act is a race condition: both requests read `status = pending`, both start a run. The fix is one transaction that locks the row first:

```sql
BEGIN;
SELECT status FROM tasks WHERE id = $1 FOR UPDATE;   -- second request waits here
-- status is pending? dependencies completed? then:
INSERT INTO workflow_runs ...; UPDATE tasks SET status = 'running' ...;
COMMIT;
```

Like a single toilet key: whoever holds it finishes first; the next person then sees "occupied" (`409`). `tests/api.test.js` fires two simultaneous runs and asserts exactly one `202` and one `409`.

### 4. Circular dependencies (recursive CTE)

Adding "A depends on B" is illegal if B already depends on A, directly or through others (A→C→B→A). The check walks B's dependency chain:

```sql
WITH RECURSIVE chain AS (
  SELECT depends_on_task_id FROM task_dependencies WHERE task_id = $B
  UNION
  SELECT td.depends_on_task_id FROM task_dependencies td
  JOIN chain c ON td.task_id = c.depends_on_task_id
)
SELECT 1 FROM chain WHERE depends_on_task_id = $A LIMIT 1;
```

`UNION` (not `UNION ALL`) removes repeated rows, which also guarantees the recursion ends. A dependency can only be added or removed while the task is `pending` (changing what a running task waits for makes no sense). The optional migration adds a unique index and a `CHECK (task_id <> depends_on_task_id)` so the database enforces it too.

### 5. Revocable sessions — and a bug the tests caught

A JWT alone cannot be "logged out": it is valid until it expires. So each token's SHA-256 hash is stored in `auth_sessions`; logout sets `revoked = true`, and `verifyToken` checks the row on every request. Only the hash is stored, so a database leak does not leak usable tokens.

**Bug found by the smoke test:** two logins within the same second produced the *identical* token (same `id`, `email`, `iat`), so revoking one revoked the other. Fix: every token gets a unique `jti` (`jwtid: crypto.randomUUID()`).

### 6. Service-to-service callback

Teammates' services are not users, so they authenticate with a shared secret in the `X-Service-Key` header (`SERVICE_API_KEY` in `.env`), compared with `crypto.timingSafeEqual` (a plain `===` leaks timing information). Without the variable the endpoint answers `503` instead of silently allowing everything.

The backend notifies the agent service with `POST {AGENT_SERVICE_URL}/runs` *after* the transaction commits and answers `202 Accepted` immediately — the work is asynchronous, the client polls `GET /api/runs/:id`. If the agent service is down or answers non-2xx, the run and task are marked `failed` so nothing stays `running` forever.

### 7. Smaller decisions

| Decision | Reason |
|---|---|
| Cancel a pending invite = `DELETE` the member row | One code path for "remove member" and "cancel invite"; a pending invite *is* a member row with `status = Pending`. |
| Owner cannot leave or be removed | A workspace must always have an owner; the Owner deletes the workspace instead. |
| Admins cannot remove Admins | Prevents Admin-vs-Admin takeovers; only the Owner can. |
| `404` for non-members on tasks and runs | Same resource-hiding rule as workspaces (Session 5). |
| Flat `/api/tasks?workspaceId=` kept next to the nested routes | Session 5's "next up" list named `GET/POST /api/tasks`; both styles reuse the same controllers. (If the frontend's `api.js` expects other field names or shapes, adjust there — confirm with the frontend owner.) |
| Password minimum 8 characters, email format check on register | Basic input hygiene; existing users are unaffected. |

### 8. Testing

- `tests/api.test.js` (`npm test`): 6 test groups — auth/sessions, workspaces & members, tasks, dependencies, runs (including the race), cleanup/global errors — **all pass**.
- `smoke_test.sh`: 86 checks over the whole API — **86 / 86 pass** against PostgreSQL 16.
- End-to-end with `tools/mock-agent-service.js`: run → `202`, task `running`, agent callback ~1 s later, task `completed` (or `failed` for a title containing "fail").

**Problems met on the way (worth remembering):**
- `generateTken` typo in `login` → every successful password check ended in `500` (the `catch` hid the real `ReferenceError`; always read the server log).
- Node's `fetch` refuses some ports by specification (6000 is one of them): `fetch failed … bad port`. Use another port for services (the mock uses 7001).
- The terminal is **fish**: `<< 'EOF'` heredocs and `VAR=$(…)` do not work there. Run `bash` first, or use `bash script.sh`.
- Placeholder values (`asli@email.com`) in copy-pasted commands produce `null` tokens; an empty/invalid token then shows up as `401 Invalid or expired token` on every later call.

### 9. Known gaps

- No refresh tokens, no password reset, and no email verification: anyone who registers an invited address can accept that invite (Session 5, section 11 already flagged this).
- No rate limiting (`429`) and no caching headers (`ETag`).
- Roles are only `Owner/Admin/Member`; there is no read-only role.
- Artifacts, AI-agent logic and the frontend are other teammates' services; the integration contract is in `README.md`.
- If the backend restarts between sending a run to the agent service and receiving the callback, the run is still stored as `running` (the callback will still work). Runs never time out on their own.

### Status

✅ Identity & Access Service — complete (register, login, me, logout, logout-all, sessions)
✅ Workspace & Task Service — complete (workspaces, members, invites, tasks, dependencies, runs)
✅ Tests, API reference (`docs/openapi.yaml`), README, mock agent service
⏳ Integration with the AI Agent / Execution & Artifact services and the frontend

## Glossary additions

- **State machine** — a fixed set of states and the only allowed moves between them.
- **`SELECT … FOR UPDATE`** — locks the selected rows until the transaction ends; other transactions wait.
- **Recursive CTE** — a query that references itself to walk a chain or tree (here: a dependency graph).
- **`jti`** — the "JWT ID" claim; a unique id per token.
- **Token revocation** — invalidating a token before it expires, by tracking it server-side.
- **`202 Accepted`** — the request was accepted but the work is not finished yet.
- **Timing attack** — guessing a secret from how long a comparison takes; `timingSafeEqual` takes constant time.
- **Idempotent / race-safe** — repeating or overlapping requests cannot produce two results.
