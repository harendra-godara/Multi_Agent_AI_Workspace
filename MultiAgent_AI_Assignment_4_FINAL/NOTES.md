# Assignment 4 Notes — Multi-Agent AI Workspace

## Service
Selected service: **Workspace & Task Service**. This follows the team's existing project boundary and owns workspaces, workspace members, tasks, task dependencies and workflow runs.

## A2 — SOAP-style starting operations
createTask(...), getTask(...), listTasks(...), cancelTask(...), runTask(...)

## A4 — Resource table
| Method | URL | What it does | Success | Failure |
|---|---|---|---|---|
| POST | /tasks | Creates a task | 201 | 400, 409, 422 |
| GET | /tasks/{taskId} | Reads one task | 200 | 404 |
| GET | /tasks?status=running | Filters tasks | 200 | 400 |
| POST | /tasks/{taskId}/cancellation | Changes task state to cancelled | 202 | 404, 409, 422 |

## A5 — Hard choice
Cancellation is a state transition rather than a normal CRUD verb. I used `/tasks/{taskId}/cancellation` as a focused sub-resource and rejected `/cancelTask` because verbs should not appear in URLs. I also rejected a broad PUT because it would expose unrelated task fields.

## D3 — Fallback
If the AI Agent Service is unreachable, the task remains persisted instead of pretending that execution succeeded. The caller can retry orchestration later; a false success would give the user an incorrect task state.

## Assignment 3 comparison
1. The Assignment 3 WSDL in the team's previous submission has 77 lines; this OpenAPI file has 140 lines. The difference is mostly REST resource paths, HTTP parameters, reusable schemas and response documentation. Two WSDL-specific declarations not needed here are the SOAP binding/transport declaration and the SOAP operation/SOAPAction declaration.

2. Assignment 3 fault:
`<providerError>GATEWAY_UNAVAILABLE</providerError>`
A REST equivalent is an HTTP 503 with the common problem body:
`{"type":"https://httpstatuses.com/503","title":"Service Unavailable","status":503,"detail":"AI Agent Service is temporarily unavailable."}`
A 200 containing an error is misleading because intermediaries, monitoring and clients interpret 200 as successful HTTP processing.

3. UDDI publish/find/bind becomes simpler: catalogue/document publication and discovery can remain, but a live UDDI server is not needed. OpenAPI documents the contract and HTTP clients bind by using the service URL.

4. `validate()` in `app.py` now performs the XML-Schema-like body validation. Without it, a request missing `title` or `description` could reach application code and cause an uncontrolled error.

5. I would still choose SOAP for a high-assurance enterprise integration that requires a strict WSDL contract and message-level security. The guarantee is the standardized SOAP message/security/fault model at that boundary.

## Team
| Role | Name | Roll No. |
|---|---|---|
| Leader | Anurag Sharma | __________ |
| Member | Mohit Tailor | __________ |
| Member | Harshita Rathore | __________ |
| Member | Harendra Godara | __________ |

Roll numbers and TeamID were not supplied, so they are left blank rather than invented.
