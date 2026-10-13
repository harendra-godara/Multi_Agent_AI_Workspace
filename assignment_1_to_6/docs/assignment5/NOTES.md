# Assignment 5 — HTTP Methods, Headers, Caching & Retries
GET is safe/idempotent for reads. POST is used for state-changing actions such as register, create task and runTask. PATCH is used for partial updates; DELETE is idempotent when supported. OPTIONS exposes Allow.
Requests use Accept, Content-Type and Authorization: Bearer. Creation uses 201 + Location; empty successful DELETE uses 204. GET task/status may expose Cache-Control and ETag; If-None-Match can produce 304 and stale If-Match produces 412.
429 and 503 are transient and use Retry-After. GET/HEAD/OPTIONS can be retried safely. POST /tasks/{id}/run is retried only with an idempotency key/request token. Ordinary unchanged 4xx responses are not retried.
