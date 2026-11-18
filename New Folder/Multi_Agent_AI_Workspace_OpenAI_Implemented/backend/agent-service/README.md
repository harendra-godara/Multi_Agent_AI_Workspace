# AI Agent Service

Real OpenAI-powered multi-agent service for Multi-Agent AI Workspace.

## Agents

1. **Research Agent** — requirements, context, constraints and research. Uses OpenAI web search when enabled.
2. **Coding Agent** — implementation architecture and code-level plan.
3. **Database Agent** — PostgreSQL schema, relationships, indexes and transactions.
4. **Testing Agent** — unit, integration, API, security and edge-case test strategy.
5. **Review Agent** — final quality gate and consolidated solution.

The agents run sequentially so each downstream agent receives the previous agent's output.

## Configuration

Copy `.env.example` to `.env` and set:

```env
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5.5
AGENT_PORT=5100
SERVICE_API_KEY=the-same-key-used-by-the-backend
BACKEND_URL=http://localhost:5000/api
ENABLE_WEB_SEARCH=true
```

The OpenAI key is server-side only. Do not expose it through Vite or the browser.

## Run

```bash
npm install
npm run dev
```

Health check:

```bash
curl http://localhost:5100/health
```

The backend calls `POST /runs` with the service key. The service immediately returns `202`, executes the agents in the background, then calls:

```text
PATCH http://localhost:5000/api/runs/:runId
```

with `X-Service-Key` to store the final result in PostgreSQL.
