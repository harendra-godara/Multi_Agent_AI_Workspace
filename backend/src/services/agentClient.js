const pool = require('../config/db');

// Hands a started run to the AI Agent Service (teammate's service).
// Set AGENT_SERVICE_URL to enable. Until then the run simply stays 'running'
// and can be finished with PATCH /api/runs/:id (X-Service-Key header).
async function dispatchRun(run, task) {
  const baseUrl = process.env.AGENT_SERVICE_URL;
  if (!baseUrl) {
    console.log(`[agentClient] AGENT_SERVICE_URL not set; run ${run.id} left in 'running'`);
    return;
  }

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/runs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Key': process.env.SERVICE_API_KEY || '',
      },
      body: JSON.stringify({
        runId: run.id,
        taskId: task.id,
        workspaceId: task.workspace_id,
        title: task.title,
        description: task.description,
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`Agent service responded with ${response.status}`);
    }
  } catch (err) {
    console.error('[agentClient] dispatch failed:', err.message);
    try {
      await pool.query(
        "UPDATE workflow_runs SET status = 'failed', result = $1, completed_at = NOW() WHERE id = $2 AND status = 'running'",
        [JSON.stringify({ error: 'Agent service unavailable' }), run.id]
      );
      await pool.query(
        "UPDATE tasks SET status = 'failed', updated_at = NOW() WHERE id = $1 AND status = 'running'",
        [task.id]
      );
    } catch (innerErr) {
      console.error('[agentClient] could not mark run as failed:', innerErr.message);
    }
  }
}

module.exports = { dispatchRun };
