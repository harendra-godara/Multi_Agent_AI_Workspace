# Multi-Agent AI Workspace - Curl API Tests

Base URL:
http://localhost:3000

> Start the server first:
> cd services/workspace-task-service
> npm start

---

## 1. GET /tasks — Without Authentication

Expected: 401 Unauthorized

curl -i http://localhost:3000/tasks

---

## 2. GET /tasks — With Authentication

Expected: 200 OK

curl -i \
  -H "Authorization: Bearer test-token" \
  http://localhost:3000/tasks

---

## 3. POST /tasks — Create a Task

Expected: 201 Created

curl -i -X POST http://localhost:3000/tasks \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test AI Task","description":"Test task for CS543"}'

> Note the task ID returned in the response.
> Example: task-1

---

## 4. GET /tasks/{id} — Get One Task

Replace task-1 with your actual task ID.

curl -i \
  -H "Authorization: Bearer test-token" \
  http://localhost:3000/tasks/task-1

Expected: 200 OK

This response should contain an ETag header.

---

## 5. GET /tasks/{id} — Unknown Task

Expected: 404 Not Found

curl -i \
  -H "Authorization: Bearer test-token" \
  http://localhost:3000/tasks/unknown-task

---

## 6. POST /tasks — Invalid Body

Expected: 422 Unprocessable Entity

curl -i -X POST http://localhost:3000/tasks \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{}'

---

## 7. POST /tasks — Malformed JSON

Expected: 400 Bad Request

curl -i -X POST http://localhost:3000/tasks \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test AI Task",'

---

## 8. POST /tasks — Idempotency-Key

First request:

curl -i -X POST http://localhost:3000/tasks \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: test-task-001" \
  -d '{"title":"Idempotent Task","description":"Testing safe retry"}'

Repeat the same request:

curl -i -X POST http://localhost:3000/tasks \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: test-task-001" \
  -d '{"title":"Idempotent Task","description":"Testing safe retry"}'

Expected: The same task should be returned instead of creating a duplicate.

---

## 9. POST /tasks/{id}/run — Run AI Task

Replace task-1 with your actual task ID.

curl -i -X POST http://localhost:3000/tasks/task-1/run \
  -H "Authorization: Bearer test-token"

Expected: 202 Accepted

---

## 10. POST /tasks/{id}/run — Repeat Run

curl -i -X POST http://localhost:3000/tasks/task-1/run \
  -H "Authorization: Bearer test-token"

Expected: 409 Conflict

This checks the illegal state transition.

---

## 11. GET /tasks/{id}/status

curl -i \
  -H "Authorization: Bearer test-token" \
  http://localhost:3000/tasks/task-1/status

Expected: 200 OK

---

## 12. GET /tasks/{id} — ETag / Conditional Request

First get the ETag:

curl -i \
  -H "Authorization: Bearer test-token" \
  http://localhost:3000/tasks/task-1

Copy the ETag value.

Then:

curl -i \
  -H "Authorization: Bearer test-token" \
  -H 'If-None-Match: "YOUR_ETAG_HERE"' \
  http://localhost:3000/tasks/task-1

Expected: 304 Not Modified

---

## 13. PATCH /tasks/{id} — Update Task

Use the correct ETag from the GET request.

curl -i -X PATCH http://localhost:3000/tasks/task-1 \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -H 'If-Match: "YOUR_ETAG_HERE"' \
  -d '{"description":"Updated description"}'

Expected: 200 OK

---

## 14. PATCH /tasks/{id} — Wrong ETag

curl -i -X PATCH http://localhost:3000/tasks/task-1 \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -H 'If-Match: "wrong-etag"' \
  -d '{"description":"This should fail"}'

Expected: 412 Precondition Failed

---

## 15. OPTIONS /tasks

curl -i -X OPTIONS http://localhost:3000/tasks

Expected: 204 No Content

The response should contain an Allow header.

---

## 16. DELETE /tasks/{id}

curl -i -X DELETE http://localhost:3000/tasks/task-1 \
  -H "Authorization: Bearer test-token"

Expected: 204 No Content

---

## Quick Test Order

1. GET /tasks without token       -> 401
2. GET /tasks with token          -> 200
3. POST /tasks                    -> 201
4. GET /tasks/{id}                -> 200 + ETag
5. Unknown task                   -> 404
6. Invalid body                   -> 422
7. Malformed JSON                 -> 400
8. Idempotency-Key                -> same result on retry
9. POST /tasks/{id}/run           -> 202
10. Repeat run                    -> 409
11. GET /tasks/{id}/status        -> 200
12. If-None-Match                 -> 304
13. PATCH with correct ETag       -> 200
14. PATCH with wrong ETag         -> 412
15. OPTIONS                       -> 204
16. DELETE                        -> 204
