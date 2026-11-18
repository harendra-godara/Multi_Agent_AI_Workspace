const pool = require('../config/db');
const { UUID_REGEX } = require('../utils/validators');
const { dispatchRun } = require('../services/agentClient');

async function runTask(req, res) {
  const client = await pool.connect();
  let run;
  let task;
  try {
    await client.query('BEGIN');

    // Lock the task row so two simultaneous run requests cannot both start a run.
    const locked = await client.query(
      'SELECT id, workspace_id, title, description, status FROM tasks WHERE id = $1 FOR UPDATE',
      [req.task.id]
    );
    task = locked.rows[0];

    if (task.status !== 'pending') {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: `Only pending tasks can be run (task is '${task.status}')` });
    }

    const blocking = await client.query(
      `SELECT t.id, t.title, t.status
       FROM task_dependencies td
       JOIN tasks t ON t.id = td.depends_on_task_id
       WHERE td.task_id = $1 AND t.status <> 'completed'`,
      [task.id]
    );
    if (blocking.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        message: 'Task has dependencies that are not completed',
        blockedBy: blocking.rows,
      });
    }

    const inserted = await client.query(
      "INSERT INTO workflow_runs (task_id, status) VALUES ($1, 'running') RETURNING id, task_id, status, started_at",
      [task.id]
    );
    run = inserted.rows[0];

    await client.query("UPDATE tasks SET status = 'running', updated_at = NOW() WHERE id = $1", [task.id]);

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    return res.status(500).json({ message: 'Something went wrong' });
  } finally {
    client.release();
  }

  // Fire and forget: the client gets 202 now, the agent service works in the background.
  dispatchRun(run, task).catch((err) => console.error(err));

  res
    .status(202)
    .location(`/api/runs/${run.id}`)
    .json({ run, task: { id: task.id, status: 'running' } });
}

async function listRuns(req, res) {
  try {
    const result = await pool.query(
      `SELECT id, task_id, status, result, started_at, completed_at
       FROM workflow_runs
       WHERE task_id = $1
       ORDER BY started_at DESC`,
      [req.task.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong' });
  }
}

async function getRun(req, res) {
  const runId = req.params.runId;

  if (!UUID_REGEX.test(runId)) {
    return res.status(404).json({ message: 'Run not found' });
  }

  try {
    const result = await pool.query(
      `SELECT r.id, r.task_id, r.status, r.result, r.started_at, r.completed_at
       FROM workflow_runs r
       JOIN tasks t ON t.id = r.task_id
       JOIN workspace_members wm
         ON wm.workspace_id = t.workspace_id AND wm.user_id = $2 AND wm.status = 'Active'
       WHERE r.id = $1`,
      [runId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Run not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong' });
  }
}

// Called by the AI Agent / Execution services (X-Service-Key) to report the outcome of a run.
async function updateRun(req, res) {
  const runId = req.params.runId;
  const { status, result } = req.body;

  if (!UUID_REGEX.test(runId)) {
    return res.status(404).json({ message: 'Run not found' });
  }
  if (!['completed', 'failed'].includes(status)) {
    return res.status(400).json({ message: "status must be 'completed' or 'failed'" });
  }
  if (result !== undefined && (typeof result !== 'object' || result === null)) {
    return res.status(400).json({ message: 'result must be a JSON object' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existing = await client.query(
      'SELECT id, task_id, status FROM workflow_runs WHERE id = $1 FOR UPDATE',
      [runId]
    );
    if (existing.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Run not found' });
    }
    if (existing.rows[0].status !== 'running') {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: `Run is already '${existing.rows[0].status}'` });
    }

    const updated = await client.query(
      `UPDATE workflow_runs
       SET status = $1, result = $2, completed_at = NOW()
       WHERE id = $3
       RETURNING id, task_id, status, result, started_at, completed_at`,
      [status, result === undefined ? null : JSON.stringify(result), runId]
    );

    await client.query(
      'UPDATE tasks SET status = $1, updated_at = NOW() WHERE id = $2',
      [status, existing.rows[0].task_id]
    );

    await client.query('COMMIT');
    res.json(updated.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Something went wrong' });
  } finally {
    client.release();
  }
}

module.exports = { runTask, listRuns, getRun, updateRun };
