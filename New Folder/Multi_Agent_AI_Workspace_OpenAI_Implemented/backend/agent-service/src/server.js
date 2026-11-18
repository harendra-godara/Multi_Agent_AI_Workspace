require('dotenv').config({ quiet: true });
const express = require('express');
const cors = require('cors');
const { AGENTS, executeWorkflow } = require('./agents');

const app = express();
app.disable('x-powered-by');
app.use(cors());
app.use(express.json({ limit: '1mb' }));

function serviceAuth(req, res, next) {
  const expected = process.env.SERVICE_API_KEY;
  if (!expected) return res.status(503).json({ message: 'SERVICE_API_KEY is not configured' });
  if (req.headers['x-service-key'] !== expected) return res.status(401).json({ message: 'Invalid service key' });
  next();
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ai-agent-service', agents: AGENTS.map(({ id, name, role }) => ({ id, name, role })) });
});

app.get('/agents', serviceAuth, (req, res) => {
  res.json(AGENTS.map(({ id, name, role }) => ({ id, name, role, status: 'ready' })));
});

app.post('/runs', serviceAuth, async (req, res) => {
  const { runId, taskId, workspaceId, title, description } = req.body || {};
  if (!runId || !taskId || !workspaceId || !title) {
    return res.status(400).json({ message: 'runId, taskId, workspaceId and title are required' });
  }

  res.status(202).json({ accepted: true, runId });

  try {
    const result = await executeWorkflow({ runId, taskId, workspaceId, title, description });
    await fetch(`${(process.env.BACKEND_URL || 'http://localhost:5000/api').replace(/\/$/, '')}/runs/${runId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Key': process.env.SERVICE_API_KEY,
      },
      body: JSON.stringify({ status: 'completed', result }),
    });
  } catch (error) {
    console.error(`[agent-service] run ${runId} failed:`, error);
    try {
      await fetch(`${(process.env.BACKEND_URL || 'http://localhost:5000/api').replace(/\/$/, '')}/runs/${runId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Service-Key': process.env.SERVICE_API_KEY,
        },
        body: JSON.stringify({
          status: 'failed',
          result: { error: error.message || 'Agent workflow failed' },
        }),
      });
    } catch (callbackError) {
      console.error('[agent-service] failed to callback backend:', callbackError.message);
    }
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Agent service error' });
});

const port = Number(process.env.AGENT_PORT || 5100);
app.listen(port, () => console.log(`AI Agent Service running on http://localhost:${port}`));
