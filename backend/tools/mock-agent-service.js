// Stand-in for the AI Agent / Execution services, so the whole flow can be demoed without the teammates' code.
// It also documents the contract the real services must follow:
//   1) backend  -> POST {AGENT_SERVICE_URL}/runs   { runId, taskId, workspaceId, title, description }   header X-Service-Key
//   2) service  -> PATCH {BACKEND_URL}/api/runs/:runId   { status: "completed"|"failed", result: {...} }   header X-Service-Key
//
// Usage:  SERVICE_API_KEY=<same as backend .env> node tools/mock-agent-service.js
// Then start the backend with AGENT_SERVICE_URL=http://localhost:7001
// (Avoid ports that fetch() blocks by spec, e.g. 6000, 6665-6669, 4045, 5060, 10080: the backend would fail with "bad port".)
// A task whose title contains the word "fail" is reported as failed; everything else completes.
require('dotenv').config({ quiet: true });
const http = require('http');

const PORT = process.env.MOCK_AGENT_PORT || 7001;
const BACKEND_URL = (process.env.BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');
const KEY = process.env.SERVICE_API_KEY || '';
const DELAY_MS = Number(process.env.MOCK_DELAY_MS || 2000);

async function reportResult(job) {
  const failed = /fail/i.test(job.title || '');
  const body = failed
    ? { status: 'failed', result: { error: 'Mock agent was asked to fail' } }
    : {
        status: 'completed',
        result: {
          output: `Mock agent finished: ${job.title}`,
          artifacts: [{ name: 'summary.txt', type: 'text/plain' }],
        },
      };

  try {
    const response = await fetch(`${BACKEND_URL}/api/runs/${job.runId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-Service-Key': KEY },
      body: JSON.stringify(body),
    });
    console.log(`[mock-agent] run ${job.runId} -> ${body.status} (backend answered ${response.status})`);
  } catch (err) {
    console.error('[mock-agent] could not reach backend:', err.message);
  }
}

const server = http.createServer((req, res) => {
  if (req.method !== 'POST' || req.url !== '/runs') {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ message: 'Not found' }));
  }
  if (KEY && req.headers['x-service-key'] !== KEY) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ message: 'Invalid service key' }));
  }

  let raw = '';
  req.on('data', (chunk) => { raw += chunk; });
  req.on('end', () => {
    let job;
    try {
      job = JSON.parse(raw);
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ message: 'Invalid JSON' }));
    }
    console.log(`[mock-agent] received run ${job.runId} for task "${job.title}"`);
    res.writeHead(202, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ accepted: true }));
    setTimeout(() => reportResult(job), DELAY_MS);
  });
});

server.listen(PORT, () => console.log(`[mock-agent] listening on port ${PORT}, reporting to ${BACKEND_URL}`));
