const { AGENT_SERVICE_URL } = process.env;

async function listAgents(req, res) {
  if (!AGENT_SERVICE_URL) return res.status(503).json({ message: 'AI Agent Service is not configured' });
  try {
    const response = await fetch(`${AGENT_SERVICE_URL.replace(/\/$/, '')}/agents`, {
      headers: { 'X-Service-Key': process.env.SERVICE_API_KEY || '' },
      signal: AbortSignal.timeout(5000),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) return res.status(response.status).json(body);
    res.json(body);
  } catch (err) {
    res.status(503).json({ message: 'AI Agent Service unavailable' });
  }
}

module.exports = { listAgents };
