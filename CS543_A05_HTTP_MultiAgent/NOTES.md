# NOTES - CS543 Assignment 5: HTTP Methods & Headers

**Team ID:** <Team ID>

| Roll No. | Name |
|---|---|
| <Roll No.> | <Name> |
| <Roll No.> | <Name> |
| <Roll No.> | <Name> |
| <Roll No.> | <Name> |

Service: **Tasks** of the Multi-Agent AI Workspace. A task has `id, title, workspaceId, steps[{agent, attempts}], status (pending / running / completed / cancelled), version, createdAt, updatedAt`.

---

## 1. Method map (A1, A2)  - action -> method + URL

| Action | Method + URL | Note |
|---|---|---|
| List tasks (filter / sort / paginate) | `GET /tasks?status=&agent=&workspaceId=&sort=&order=&page=&limit=` | pure read (A4) |
| Read one task | `GET /tasks/{id}` | |
| Create a task | `POST /tasks` | |
| Replace a task | `PUT /tasks/{id}` | title, workspaceId, steps |
| Change part of a task | `PATCH /tasks/{id}` | |
| Delete a task | `DELETE /tasks/{id}` | |
| Start a task | `POST /tasks/{id}/start` | non-CRUD action = POST to a sub-resource |
| Complete a task | `POST /tasks/{id}/complete` | same |
| Cancel a task | `POST /tasks/{id}/cancel` | same (never `POST /cancelTask`) |
| What can I do here? | `OPTIONS /tasks`, `OPTIONS /tasks/{id}` | returns `Allow` |

No verb leaked into a URL. `status` cannot be written through PUT/PATCH (422): only the three action URLs change it.

## 2. Safe and idempotent (A3)

| Endpoint | Safe (changes nothing) | Idempotent (repeat = same effect) | Retry-safe how |
|---|---|---|---|
| `GET /tasks`, `GET /tasks/{id}` | yes | yes | naturally |
| `OPTIONS ...` | yes | yes | naturally |
| `PUT /tasks/{id}` | no | yes | naturally (+ `If-Match` to avoid lost updates) |
| `PATCH /tasks/{id}` | no | no in general, here yes (sets fields to given values) | `If-Match` |
| `DELETE /tasks/{id}` | no | yes (second call is 404, but the state is the same) | naturally |
| `POST /tasks/{id}/cancel` | no | yes (cancelling a cancelled task returns 200 again) | naturally |
| `POST /tasks/{id}/start`, `/complete` | no | no (second call = 409) | the 409 tells the client it already happened |
| `POST /tasks` | no | **no** (each call creates another task) | `Idempotency-Key` |

No GET changes state (checked by `tests/api.test.js`).

## 3. Headers table (D2)

| Endpoint | Request headers it needs | Response headers it sets |
|---|---|---|
| every endpoint | `X-Client-Id` (optional, else IP is the client), `Accept-Encoding: gzip` (optional) | `Date`, `Server`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`, `Access-Control-Allow-Origin`, `Access-Control-Expose-Headers`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `Cache-Control`, `Content-Type`, `Content-Encoding` (gzip when large), `Vary` |
| `GET /tasks` | `Accept` (JSON) | `Cache-Control: no-cache`, `X-Total-Count` |
| `GET /tasks/{id}` | `Accept`, `If-None-Match` | `ETag`, `Cache-Control: private, max-age=30, must-revalidate`; `304` has the same two and no body |
| `POST /tasks` | `Authorization: Bearer`, `Content-Type: application/json`, `Idempotency-Key` | `Location`, `ETag`, `Idempotent-Replayed: true` (on a replay), `WWW-Authenticate` (on 401) |
| `PUT` / `PATCH /tasks/{id}` | `Authorization`, `Content-Type`, `If-Match` | new `ETag` |
| `DELETE /tasks/{id}` | `Authorization` (or `POST` + `X-HTTP-Method-Override: DELETE`) | none extra (204) |
| `POST /tasks/{id}/start` ... | `Authorization` | new `ETag`, `Cache-Control: no-store` |
| `OPTIONS` | (preflight: `Origin`, `Access-Control-Request-Method`, `Access-Control-Request-Headers`) | `Allow`, or `Access-Control-Allow-Methods / -Headers / -Max-Age` |
| any 429 | - | `Retry-After` |

## 4. Safe-retry plan (C4)

| Risky endpoint | Mechanism | Why |
|---|---|---|
| `POST /tasks` | `Idempotency-Key` | not idempotent: a retry after a lost response would create a **duplicate task**, and for us a duplicate task means an AI agent runs the same work twice (wasted quota and duplicate artifacts). The same key returns the original `201` + `Location`. |
| `PUT` / `PATCH /tasks/{id}` | `If-Match` | two editors must not overwrite each other; a stale ETag gets `412` instead of a silent overwrite. |
| `GET /tasks/{id}` | `If-None-Match` | already safe to retry; the conditional only saves bandwidth (`304`). |
| `DELETE`, `cancel` | nothing needed | idempotent. |

## 5. One complete exchange (A6)

**Request**
```
POST /tasks HTTP/1.1                                  <- request line: method, target, HTTP version = 1.1
Host: localhost:3000                                  <- headers
User-Agent: curl/8.5.0
Accept: */*
Authorization: Bearer demo-token
Content-Type: application/json
Idempotency-Key: demo-key-1
Content-Length: 98

{"title":"Write release notes","workspaceId":"ws-1","steps":[{"agent":"Docs Agent","attempts":1}]}      <- JSON body
```

**Response**
```
HTTP/1.1 201 Created                                  <- status line
Server: multi-agent-tasks/1.0                         <- headers
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=31536000; includeSubDomains
Cache-Control: no-store
Access-Control-Allow-Origin: *
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 60
Location: /tasks/4
ETag: "14bba469cad24232"
Content-Type: application/json; charset=utf-8
Content-Length: 214
Date: Wed, 18 Nov 2026 03:07:39 GMT

{"id":4,"title":"Write release notes","workspaceId":"ws-1","steps":[{"agent":"Docs Agent","attempts":1}],"status":"pending","version":1,"createdAt":"2026-11-18T03:07:39.390Z","updatedAt":"2026-11-18T03:07:39.390Z"}     <- JSON body
```

---

## Answers

**1. Three endpoints: method, success status, the one header that matters most.**
- `POST /tasks` -> `201` -> **`Location: /tasks/4`**: the client learns the URL of the new task without guessing.
- `GET /tasks/1` -> `200` -> **`ETag`**: it identifies this exact version of the task, so the client can later ask `If-None-Match` (cheap `304`) or `If-Match` (safe write).
- `PATCH /tasks/1` -> `200` -> **new `ETag`**: the task changed, so the tag changes; the client must use the new tag in its next `If-Match`, and every older tag now correctly fails with `412`.

**2. Safe / idempotent; the one that is neither.**
Safe: `GET`, `OPTIONS`. Idempotent: those plus `PUT`, `DELETE` and `cancel`. `POST /tasks` is **neither** safe nor idempotent. I made it retry-safe with the `Idempotency-Key` header: the server stores key + body fingerprint; the same key with the same body returns the original `201` (marked `Idempotent-Replayed: true`) and creates nothing; the same key with a *different* body is refused with `422`. Proof: transcript D1a/D1b (both return task 4, and only one "Write release notes" exists).

**3. ETag, 304 and 412.**
- ETag of `GET /tasks/1`: `"7530cea86f871208"`.
- Request that returns **304**: `GET /tasks/1` with `If-None-Match: "7530cea86f871208"`. It **saves** the body and the bandwidth: the client reuses its copy.
- Write that returns **412**: `PATCH /tasks/1` with `If-Match: "stale-etag"`. It **prevents** a lost update: another editor changed the task, so our write would have clobbered their change.
- After a successful write with the fresh tag the ETag changes (`"add1d777029f2724"`), so old tags stop matching.

**4. 422 vs 400 - exact requests.**
- **400**: `POST /tasks` with body `{"title": ` (not even parseable JSON). The server cannot understand the request at all.
- **422**: `POST /tasks` with body `{"title":"x","workspaceId":"ws-1","steps":[]}`. The JSON is well-formed and understood, but the business rule "a task needs at least one step" refuses it.
- Difference: 400 = *malformed* (syntax), 422 = *well-formed but semantically unacceptable* (domain rule).

**5. Browser page on another origin is blocked, yet the server log shows 200.**
The **browser** blocked it. The request reached the server and the server answered 200, but the browser's same-origin policy hides the response from the page's JavaScript unless the response carries **`Access-Control-Allow-Origin`** (for non-simple requests also the preflight answer `Access-Control-Allow-Methods` / `-Headers`). We send `Access-Control-Allow-Origin: *` and answer `OPTIONS` preflights with `204`.

**6. Cache-Control.**
- Caching allowed: `GET /tasks/{id}` -> `Cache-Control: private, max-age=30, must-revalidate` (cheap to re-read, safe to reuse for 30 s, revalidated with the ETag; `private` because a shared proxy should not keep it).
- `no-store`: the responses of `POST /tasks/{id}/start` (and every write / error response). They describe a one-time state change or a run in progress, and must never be served from any cache.

**7. Search endpoint is a GET - when would POST be right?**
When the criteria do not fit in a URL: very long or sensitive filters (many agent ids, free-text prompts, personal data that should not appear in logs and browser history). What you give up: a POST is not safe/idempotent by definition, so caches, proxies and retry logic no longer treat it as a read; it cannot be bookmarked or shared as a link; and the `ETag` / `If-None-Match` path no longer works.

**8. `Location` on a 201 and on a 3xx.**
On `201 Created` it points to the **newly created resource** (`/tasks/4`). On a `3xx` redirect (301/302/303/307/308) it points to the **target the client should request next**.
