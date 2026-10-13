# Assignment 2 — Services, Contracts & Schema

## 1. Capabilities
1. User Authentication & Access
2. Workspace Management
3. Task Management
4. AI Task Orchestration
5. Specialized Agent Execution
6. Shared Agent Context
7. Review & Validation
8. Artifact & Execution Management
9. History & Monitoring
10. Final Result Delivery

## 2. Service boundaries and ownership
| Service | Owner | Data owned |
|---|---|---|
| Identity & Access | Harendra Godara | users, auth_sessions, roles/access |
| Workspace & Task | Harendra Godara | workspaces, workspace_members, tasks, task_dependencies, workflow_runs |
| AI Agent | Mohit Tailor | agents, agent_runs, messages, agent_context |
| Execution & Artifact | Anurag Sharma | artifacts, reviews, execution_logs, test_runs |
| Frontend/UI | Harshita Rathore | presentation state only; no persistent service database |

## 3. Cross-service calls
- Frontend → Identity: `loginUser`
- Frontend → Workspace & Task: `createWorkspace`, `runTask`, `status`
- Workspace & Task → Identity: `checkAccess`
- Workspace & Task → AI Agent: `executeTask`
- AI Agent → Execution & Artifact: `saveOutput`
- Execution & Artifact → AI Agent: `requestReview`

## 4. Contract tables
### Identity & Access
| Operation | Input | Output | Errors |
|---|---|---|---|
| registerUser | name, email, password | user reference | 400, 409, 422 |
| loginUser | email, password | access token + user | 400, 401 |
| checkAccess | user reference, workspace reference | allowed/denied | 401, 403, 404 |

### Workspace & Task
| Operation | Input | Output | Errors |
|---|---|---|---|
| createWorkspace | name, authenticated user | workspace | 400, 401, 422 |
| createTask | workspace, title, description | task | 400, 403, 404, 422 |
| runTask | task, execution options | workflow run | 401, 403, 404, 409, 422, 503 |
| getStatus | task/run reference | status/progress | 401, 403, 404 |

### AI Agent
| Operation | Input | Output | Errors |
|---|---|---|---|
| executeTask | task + context | agent outputs/run | 404, 409, 429, 503 |
| getAgents | filter | agent list | 401, 503 |
| requestReview | output reference | review request/result | 404, 503 |

### Execution & Artifact
| Operation | Input | Output | Errors |
|---|---|---|---|
| saveOutput | workflow/agent output | artifact reference | 400, 503 |
| getArtifact | artifact reference | artifact metadata/content | 403, 404 |
| getReview | review reference | review | 403, 404 |

## 5. Central operation — runTask
**Input:** authenticated user/workspace context, task description/reference, execution options.

**Output:** workflow run reference, status, progress, final reviewed result and artifact/log references.

**Error cases:** 401 unauthenticated, 403 unauthorized, 404 task/workspace not found, 409 invalid workflow state, 422 invalid task/options, 429 rate limited, 503 agent/AI dependency unavailable.

**Hidden implementation details:** database tables, SQL, internal primary keys, agent-selection algorithm, prompts/private context, provider credentials, retry mechanics, transaction boundaries and internal logs. Callers see only the published contract.

## 6. Five Service Properties
| Property | Result | Validation / fix |
|---|---|---|
| Reachable | Pass | Each service exposes an API endpoint or internal HTTP contract. |
| Self-contained | Pass | Each service owns its persistent data. |
| Has a contract | Pass | Operations define input/output/errors. |
| Independent | Mostly pass | Service deployment/configuration can be separated; shared auth conventions are kept at API boundary. |
| Loosely coupled | Pass | Services call APIs, not each other's databases; external IDs are references. |

## 7. Boundary rule
No persistent table belongs to two services. Cross-service references are API-level identifiers; avoid cross-service database foreign keys.
