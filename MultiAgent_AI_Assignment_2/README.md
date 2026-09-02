# Multi-Agent AI Orchestration Platform — Assignment 2

## Team and Branches

```text
main
│
├── feature/frontend       → Harshita Rathore
├── feature/backend        → Harendra Godara
├── feature/agents-db      → Mohit Tailor
└── feature/testing-infra  → Anurag Sharma (Leader)
```

## Assignment Basis

This submission applies the six tasks from Assignment 2 to the Multi-Agent AI Orchestration Platform:

1. Capabilities
2. Service design and ownership
3. Service contracts
4. Central operation
5. Database schema
6. Service validation

## Project Context

The platform lets a user create a workspace and submit a complex task. The system validates access, plans and decomposes the task, selects specialized AI agents, executes them, shares context, reviews the results, stores artifacts/logs, and delivers the final output.

## Services

### 1. Identity & Access Service
**Member:** Harendra Godara  
**Branch:** `feature/backend`

Owns:
- Users
- Authentication sessions
- Roles/access records

### 2. Workspace & Task Service
**Member:** Harendra Godara  
**Branch:** `feature/backend`

Owns:
- Workspaces
- Workspace members
- Tasks
- Task dependencies
- Workflow runs

### 3. AI Agent Service
**Member:** Mohit Tailor  
**Branch:** `feature/agents-db`

Owns:
- Agents
- Agent runs
- Messages
- Shared context
- Agent outputs

Agents represented by the project:
- Orchestrator
- Research Agent
- Database Agent
- Coding Agent
- Testing Agent
- Review Agent

### 4. Execution & Artifact Service
**Member:** Anurag Sharma (Leader)  
**Branch:** `feature/testing-infra`

Owns:
- Artifacts
- Reviews
- Execution logs
- Run history
- Test/infrastructure records

### Frontend

**Harshita Rathore — `feature/frontend`**

The frontend is the client/presentation layer. It provides login, workspace UI, task submission, task/agent status, and result/artifact display. It does not own persistent business data in this Assignment 2 benchmark.

## Cross-Service Calls

```text
Frontend
   |
   +--> Identity & Access : loginUser
   |
   +--> Workspace & Task : runTask / status

Workspace & Task
   |
   +--> Identity & Access : checkAccess
   |
   +--> AI Agent : executeTask

AI Agent
   |
   +--> Execution & Artifact : saveOutput

Execution & Artifact
   |
   +--> AI Agent : requestReview
```

## Central Operation — runTask

```text
Validate access
      ↓
Validate task
      ↓
Create workflow run
      ↓
Plan & decompose task
      ↓
Select specialized agents
      ↓
Execute agents
      ↓
Share context
      ↓
Review & validate results
      ↓
Store artifacts and logs
      ↓
Deliver final output
```

### Inputs
Authenticated user/workspace context, task description and execution options.

### Outputs
Run status, progress, reviewed final result and artifact/log references.

### Errors
- Access denied
- Invalid task
- Task already running
- No suitable agent
- Agent/model failure
- Timeout
- Review failure
- Persistence failure

### Hidden implementation details
Prompts, agent selection rules, model/provider details, retries, internal messages, database implementation and storage details are hidden from callers.

## Database Ownership

```text
Identity & Access
 ├── users
 └── auth_sessions

Workspace & Task
 ├── workspaces
 ├── workspace_members
 ├── tasks
 ├── task_dependencies
 └── workflow_runs

AI Agent
 ├── agents
 ├── agent_runs
 ├── messages
 └── agent_context

Execution & Artifact
 ├── artifacts
 ├── reviews
 └── execution_logs
```

Each table belongs to exactly one service. Cross-service IDs are treated as external references rather than shared tables.

## Files

- `design.pdf`
- `services.drawio`
- `services.png`
- `schema.drawio`
- `schema.png`
- `schema.sql`
- `README.md`


Updated diagrams: services.png and schema.png were regenerated with a cleaner, readable layout and non-overlapping arrows/connectors.
