# Multi-Agent AI Workspace — OpenAI Implementation

This package adds a real AI layer to the existing workspace project.

## What was implemented

- OpenAI Responses API integration using the official `openai` JavaScript SDK.
- Dedicated AI Agent Service.
- Five real agents: Research, Coding, Database, Testing and Review.
- Sequential orchestration where downstream agents receive upstream outputs.
- Optional OpenAI web search for the Research Agent.
- Secure server-side API key handling.
- Service-to-service authentication using `X-Service-Key`.
- Backend `/api/agents` proxy endpoint.
- Workflow callback into the existing `workflow_runs` table.
- Task list now includes the latest AI workflow result.
- Frontend task history can display the final Review Agent output.
- Frontend workspace loads the real agent list from the backend.

## Important

The provided `frontend_connected.zip` is a source/connection package and does **not** contain a `package.json` or the Vite entry/config files. I did not invent those missing project files; the existing frontend source has been updated in place. Use the original complete frontend project alongside these updated `src` files.

## Run order

### 1. PostgreSQL + backend

```bash
cd backend/backend
cp .env.example .env
# set DATABASE_URL, JWT_SECRET and SERVICE_API_KEY
npm install
npm run dev
```

### 2. AI Agent Service

```bash
cd backend/agent-service
cp .env.example .env
# set OPENAI_API_KEY and the same SERVICE_API_KEY
npm install
npm run dev
```

### 3. Frontend

```bash
cd frontend/frontend
cp .env.example .env
npm install
npm run dev
```

## Environment relationship

```text
Backend:
SERVICE_API_KEY=abc123
AGENT_SERVICE_URL=http://localhost:5100

Agent Service:
SERVICE_API_KEY=abc123
BACKEND_URL=http://localhost:5000/api
OPENAI_API_KEY=sk-...
```

Only the Agent Service receives `OPENAI_API_KEY`.

## AI workflow

```text
User task
   |
   v
React Frontend
   |
   v
Express Backend
   |
   +---- PostgreSQL: workflow_runs = running
   |
   v
AI Agent Service
   |
   +--> Research Agent
   |
   +--> Coding Agent
   |
   +--> Database Agent
   |
   +--> Testing Agent
   |
   +--> Review Agent
   |
   v
OpenAI Responses API
   |
   v
Final result
   |
   v
PATCH /api/runs/:runId
   |
   v
PostgreSQL + Frontend
```
