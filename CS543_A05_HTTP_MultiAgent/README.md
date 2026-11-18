# CS543 Assignment 5 - HTTP Methods & Headers (Multi-Agent AI Workspace)

**Team ID:** <Team ID>

| Roll No. | Name |
|---|---|
| <Roll No.> | <Name> |
| <Roll No.> | <Name> |
| <Roll No.> | <Name> |
| <Roll No.> | <Name> |

The **Tasks** service of our Multi-Agent AI Workspace project (a task is delegated to one or more AI agents). The CampusEats Orders service in the assignment text is used only as a guide.

```bash
npm install
npm start                   # http://localhost:3000   (RATE_LIMIT_MAX=100 per client per minute by default)
npm test                    # 15 tests (Node's built-in runner)
npm run transcript          # regenerates curl-transcript.txt (curl -v)
```

| File | What it is |
|---|---|
| `app.js`, `server.js` | the service |
| `openapi.yaml` | methods, statuses and headers |
| `tests/api.test.js` | automated checks for every part of the assignment |
| `curl-transcript.txt` | `curl -v` run: 201, idempotent repeat, 304, 412, 400, 404, 401 (+ 406, OPTIONS, CORS, 429 ...) |
| `NOTES.md` | method map, headers table, safe-retry plan, the eight answers |

Writes (`POST/PUT/PATCH/DELETE`) need any non-empty `Authorization: Bearer <token>`, for example `Bearer demo-token`.
