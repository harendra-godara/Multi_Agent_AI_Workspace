# CS543 Assignment 6 - Honest responses: status codes, errors & validation (Multi-Agent AI Workspace)

**Team ID:** <Team ID>

| Roll No. | Name |
|---|---|
| <Roll No.> | <Name> |
| <Roll No.> | <Name> |
| <Roll No.> | <Name> |
| <Roll No.> | <Name> |

This is the **same Tasks service as Assignment 5** (no new service), upgraded: correct status codes, one error shape (Problem Details), field-level validation, JSON/XML negotiation, no leaked internals.
The CampusEats "Orders" service in the assignment text is used only as a guide. Mapping: **order -> task, items / qty -> steps / attempts, address -> workspaceId**.

```bash
npm install
npm start               # http://localhost:3000
npm test                # 17 tests: the A06 behaviour + the A05 checks re-run (no regressions)
npm run transcript      # regenerates transcript.txt (curl -i)
```

| File | What it is |
|---|---|
| `app.js`, `server.js` | the service (`server.js` also sets request / header timeouts) |
| `openapi.yaml` | status codes and the Problem Details schema for each endpoint |
| `transcript.txt` | curl run: success path + every failure path + XML negotiation + A05 re-checks |
| `NOTES.md` | the seven answers (status map, type catalogue, ...) |
| `tests/api.test.js` | automated checks |

Writes need any non-empty `Authorization: Bearer <token>` (e.g. `Bearer demo-token`).
Demo switches: `MAINTENANCE=1` (writes get 503), `RATE_LIMIT_MAX=3` (easy 429), and fault injection on `/start`: a task in workspace `ws-crash` triggers an internal error, `ws-exhausted` a declined execution.
