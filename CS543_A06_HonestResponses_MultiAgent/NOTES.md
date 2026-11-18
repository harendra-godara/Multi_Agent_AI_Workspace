# NOTES - CS543 Assignment 6: Honest responses

**Team ID:** <Team ID>

| Roll No. | Name |
|---|---|
| <Roll No.> | <Name> |
| <Roll No.> | <Name> |
| <Roll No.> | <Name> |
| <Roll No.> | <Name> |

Service: the **Tasks** service of the Multi-Agent AI Workspace, built on A05 (same service, no new one).
Mapping from the assignment text: order -> **task**, items / qty -> **steps / attempts**, address -> **workspaceId**.
Every failure goes through one helper, `problem()`, and is sent as `application/problem+json; charset=utf-8`.

---

## 1. Status map - every endpoint, success status, and each failure (with why)

| Endpoint | Success | Failures (status - why) |
|---|---|---|
| `GET /tasks` | **200** list | 400 bad query parameter (status/sort/order/page/limit); 406 cannot produce the requested type; 429 over the per-client limit |
| `GET /tasks/{id}` | **200** (or **304** if `If-None-Match` matches) | 404 no such task; 406 cannot produce the requested type |
| `POST /tasks` | **201** + `Location: /tasks/{id}` | 400 body is not valid JSON / missing; 401 no bearer token; 415 body is not JSON; 422 valid JSON but rejected (see below); 422 same `Idempotency-Key` with a different body; 429; 503 maintenance |
| `PUT /tasks/{id}` | **200** | 401; 404; 412 `If-Match` is stale; 422 field errors / offline agent / `status` supplied; 400 bad body; 503 |
| `PATCH /tasks/{id}` | **200** | same as PUT; 400 when none of title / workspaceId / steps is sent |
| `DELETE /tasks/{id}` | **204** | 401; 404; 409 the task is running (state conflict); 503 |
| `POST /tasks/{id}/start` | **200** | 401; 404; 409 task is not pending; 422 workspace has no execution quota; **500** internal failure (mapped, nothing leaked) |
| `POST /tasks/{id}/complete` | **200** | 401; 404; 409 task is not running |
| `POST /tasks/{id}/cancel` | **200** (also on a repeat) | 401; 404; 409 task is already completed |
| `OPTIONS /tasks...` | **204** + `Allow` | 404 unknown path |
| any other method on a known path | - | **405** + `Allow` |
| unknown path | - | **404** `route-not-found` |

**200 is never used for a failure**: the status is the result. The reasons behind the numbers:
400 = the request cannot be understood; 401 = who are you?; 404 = no such thing; 405 = method not supported there; 406 = cannot produce that format; 409 = request is fine but the *current state* forbids it; 412 = the precondition (`If-Match`) failed; 415 = wrong body format; 422 = understood but not acceptable (validation / business rule); 429 / 503 = transient, retry later; 500 = our fault.

## 2. Type catalogue - stable `type` strings and what triggers them

All types live under `https://api.multiagent.example/problems/` (shortened to `.../` below).

| `type` (suffix) | Status | Triggered by | Maps to the assignment's |
|---|---|---|---|
| `empty-steps` | 422 | `steps` is an empty array | empty-cart |
| `agent-unavailable` | 422 | a step uses an **offline** agent (e.g. Deploy Agent) | item-unavailable |
| `execution-declined` | 422 | `POST /tasks/{id}/start` when the workspace has no execution quota (`ws-exhausted`) | payment-declined |
| `task-not-found` | 404 | the id does not exist | order-not-found |
| `illegal-transition` | 409 | start a non-pending, complete a non-running, cancel a completed, delete a running task | illegal-transition |
| `validation-error` | 422 | any other bad field(s); lists them in `errors[]` | - |
| `idempotency-key-reuse` | 422 | same `Idempotency-Key`, different body | - |
| `precondition-failed` | 412 | `If-Match` does not match the current ETag | - |
| `malformed-json` | 400 | body is not parseable JSON | - |
| `bad-request` | 400 | body missing / not an object / bad override header | - |
| `invalid-query` | 400 | bad `status`, `sort`, `order`, `page`, `limit` | - |
| `unauthorized` | 401 | write without a non-empty bearer token | - |
| `unsupported-media-type` | 415 | body is not `application/json` | - |
| `not-acceptable` | 406 | `Accept` allows neither JSON nor XML | - |
| `route-not-found` / `method-not-allowed` | 404 / 405 | unknown path / wrong method | - |
| `payload-too-large` | 413 | body over 100 kB | - |
| `rate-limited` | 429 | per-client budget used up (+ `Retry-After`) | - |
| `service-unavailable` | 503 | maintenance mode (+ `Retry-After`) | - |
| `internal-error` | 500 | unexpected failure (+ `reference`) | - |

## 3. One Problem Details body, fields labelled

`POST /tasks` with `"steps": []`:

```json
{
  "type": "https://api.multiagent.example/problems/empty-steps",
  "title": "Task has no steps",
  "status": 422,
  "detail": "A task needs at least one step.",
  "instance": "/tasks",
  "errors": [ { "field": "steps", "message": "must contain at least one step" } ]
}
```
- `type` - stable identifier of the kind of problem (what a program switches on).
- `title` - short, human-readable name of that type (same for every occurrence).
- `status` - the HTTP status repeated in the body (422).
- `detail` - explanation of *this* occurrence.
- `instance` - the URL that failed.
- `errors` - extension member: the list of bad fields (`field`, `message`).
- Header: `Content-Type: application/problem+json; charset=utf-8`.

## 4. A field-level 422 reporting two bad fields at once

Request: `POST /tasks` with `{"workspaceId":"ws-1","steps":[{"agent":"Code Agent","attempts":0}]}` (title missing and attempts = 0).

```json
{
  "type": "https://api.multiagent.example/problems/validation-error",
  "title": "Request validation failed",
  "status": 422,
  "detail": "2 fields failed validation.",
  "instance": "/tasks",
  "errors": [
    { "field": "title", "message": "is required and must be a non-empty string" },
    { "field": "steps[0].attempts", "message": "must be an integer >= 1" }
  ]
}
```
The server validates the whole body **before doing any work** and collects every error, so the client fixes everything in one round trip. An invalid request creates nothing (tested).

## 5. Which endpoints are safe to retry, and which status codes tell the client so

| Endpoint | Retry? |
|---|---|
| `GET`, `OPTIONS` | always safe |
| `PUT`, `DELETE`, `POST .../cancel` | safe: idempotent (repeat = same effect) |
| `POST /tasks` | only **with the same `Idempotency-Key`**; otherwise a retry may create a duplicate task |
| `POST .../start`, `.../complete` | do not blindly retry: a repeat gets `409` because it already happened |

Status codes that say "transient, try again": **429** and **503**, both with a **`Retry-After`** header (seconds to wait); the client should wait that long and send the *same* request. A **4xx** other than 429 must **never** be retried unchanged (400, 401, 404, 406, 409, 412, 415, 422 all need a change first, e.g. re-read the ETag, fix the body, log in). A 500 is not a promise either way, so it is retried only for the safe/idempotent endpoints above.

## 6. Where an internal error is mapped to a clean client error, and what is hidden

- In `POST /tasks/{id}/start`: the risky call `runAgents(task)` is wrapped in `try/catch`. For a task in workspace `ws-crash` it throws `connect ECONNREFUSED 10.0.3.14:5432 - password authentication failed for user "app_user"`.
  - **Logged server-side only**, with a random `reference` (see the last lines of `transcript.txt`): the full error and stack.
  - **Returned to the caller:** `500`, type `internal-error`, a generic `detail`, and the `reference` id (no message from the exception).
  - **Hidden from the caller:** the database host and port, the DB user name, the "password authentication failed" text, and the stack trace / file paths. The task is left unchanged (still `pending`).
- Same idea in the global error handler (any unexpected exception becomes `internal-error` + `reference`) and for broken JSON: the parser's own message is replaced by `The request body is not valid JSON.`
- A test (`B4 internal failures ...`) asserts that none of these strings appears in the response.

## 7. The same task as JSON and as XML, and the `Accept` header that chose each

`Accept: application/json` (or no `Accept` at all, or `*/*`) -> `Content-Type: application/json; charset=utf-8`:
```json
{"id":1,"title":"Summarise project requirements","workspaceId":"ws-1","steps":[{"agent":"Research Agent","attempts":1}],"status":"pending","version":1,"createdAt":"2026-01-10T09:00:00.000Z","updatedAt":"2026-01-10T09:00:00.000Z"}
```
`Accept: application/xml` -> `Content-Type: application/xml; charset=utf-8`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<task><id>1</id><title>Summarise project requirements</title><workspaceId>ws-1</workspaceId><steps><step><agent>Research Agent</agent><attempts>1</attempts></step></steps><status>pending</status><version>1</version><createdAt>2026-01-10T09:00:00.000Z</createdAt><updatedAt>2026-01-10T09:00:00.000Z</updatedAt></task>
```
`Accept: text/html` -> **406** `not-acceptable` (we cannot produce it). Responses carry `Vary: Accept`, and the two formats have different ETags because they are different bytes. Errors are always `application/problem+json`.

---

### Note on D4 (no regressions)
`tests/api.test.js` part 2 and the last section of `transcript.txt` re-run the A05 checks: idempotency (replay + key reuse), ETag / 304, If-Match / 412, OPTIONS / CORS / method override, security and rate-limit headers. On timeouts: this service makes no outbound calls, so the timeout protection is the server-level `requestTimeout`, `headersTimeout` and `keepAliveTimeout` set in `server.js` (a test checks they are present).
