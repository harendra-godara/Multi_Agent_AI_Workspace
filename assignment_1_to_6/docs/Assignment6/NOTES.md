# Assignment 6 — Honest Responses

1. Status map: POST /tasks→201; failures 400/401/403/422/429/503. GET /tasks→200; 401. GET /tasks/{id}→200 or 304; 401/404. PATCH→200; 400/401/403/404/409/412/422. DELETE→204; 401/403/404/409. POST /tasks/{id}/run→202; 400/401/403/404/409/422/429/503.
2. Type catalogue: validation-error, task-not-found, workspace-not-found, illegal-transition, agent-unavailable, execution-timeout, rate-limited, not-acceptable.
3. Problem example:
```json
{"type":"task-not-found","title":"Task Not Found","status":404,"detail":"The requested task does not exist."}
```
4. Two-field 422:
```json
{"type":"validation-error","title":"Validation Failed","status":422,"detail":"The request contains invalid fields.","errors":[{"field":"title","message":"Title is required."},{"field":"description","message":"Description must contain at least 10 characters."}]}
```
5. GET/HEAD/OPTIONS are safe to retry on transient failures. Idempotent PUT/DELETE can be retried. 429/503 plus Retry-After signal a transient condition. POST runTask requires idempotency protection.
6. Internal database, SQL, stack traces, provider URLs, credentials and internal exception text are logged server-side and mapped to clean 500/503 responses.
7. JSON is the default. Accept: application/xml requests XML for the same logical task. Unsupported Accept returns 406.
