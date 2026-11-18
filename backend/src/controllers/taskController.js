const pool = require('../config/db');

const STATUSES = ['pending', 'running', 'completed', 'failed'];

// Status changes a user may make by hand. pending -> running happens only via POST /tasks/:id/run,
// and running -> completed/failed only via the service callback PATCH /runs/:id.
const MANUAL_TRANSITIONS = {
  pending: ['completed'],
  running: ['pending'],
  failed: ['pending'],
  completed: ['pending'],
};

async function createTask(req, res) {
  const { title, description } = req.body;

  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ message: 'Task title is required' });
  }
  if (title.trim().length > 200) {
    return res.status(400).json({ message: 'Task title must be 200 characters or less' });
  }
  if (description !== undefined && typeof description !== 'string') {
    return res.status(400).json({ message: 'Task description must be a string' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO tasks (workspace_id, title, description, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING id, workspace_id, title, description, status, created_by, created_at, updated_at`,
      [req.workspaceId, title.trim(), description || '', req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong' });
  }
}

async function listTasks(req, res) {
  const { status } = req.query;
  const limit = req.query.limit === undefined ? 50 : Number(req.query.limit);
  const offset = req.query.offset === undefined ? 0 : Number(req.query.offset);

  if (status !== undefined && !STATUSES.includes(status)) {
    return res.status(400).json({ message: `status must be one of: ${STATUSES.join(', ')}` });
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    return res.status(400).json({ message: 'limit must be an integer between 1 and 100' });
  }
  if (!Number.isInteger(offset) || offset < 0) {
    return res.status(400).json({ message: 'offset must be a non-negative integer' });
  }

  try {
    const result = await pool.query(
      `SELECT id, workspace_id, title, description, status, created_by, created_at, updated_at
       FROM tasks
       WHERE workspace_id = $1 AND ($2::text IS NULL OR status = $2)
       ORDER BY created_at DESC
       LIMIT $3 OFFSET $4`,
      [req.workspaceId, status === undefined ? null : status, limit, offset]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong' });
  }
}

async function getTask(req, res) {
  try {
    const deps = await pool.query(
      `SELECT t.id, t.title, t.status
       FROM task_dependencies td
       JOIN tasks t ON t.id = td.depends_on_task_id
       WHERE td.task_id = $1
       ORDER BY t.created_at ASC`,
      [req.task.id]
    );

    const run = await pool.query(
      `SELECT id, status, started_at, completed_at
       FROM workflow_runs
       WHERE task_id = $1
       ORDER BY started_at DESC
       LIMIT 1`,
      [req.task.id]
    );

    res.json({ ...req.task, dependencies: deps.rows, latestRun: run.rows[0] || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong' });
  }
}

async function updateTask(req, res) {
  const { title, description, status } = req.body;

  if (title === undefined && description === undefined && status === undefined) {
    return res.status(400).json({ message: 'Provide title, description or status to update' });
  }
  if (title !== undefined && (typeof title !== 'string' || title.trim() === '' || title.trim().length > 200)) {
    return res.status(400).json({ message: 'Task title must be 1-200 characters' });
  }
  if (description !== undefined && typeof description !== 'string') {
    return res.status(400).json({ message: 'Task description must be a string' });
  }
  if (status !== undefined && !STATUSES.includes(status)) {
    return res.status(400).json({ message: `status must be one of: ${STATUSES.join(', ')}` });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const current = await client.query('SELECT status FROM tasks WHERE id = $1 FOR UPDATE', [req.task.id]);
    const currentStatus = current.rows[0].status;
    let newStatus = currentStatus;

    if (status !== undefined && status !== currentStatus) {
      if (!MANUAL_TRANSITIONS[currentStatus].includes(status)) {
        await client.query('ROLLBACK');
        return res.status(409).json({
          message: `Cannot change status from '${currentStatus}' to '${status}'`,
        });
      }
      newStatus = status;

      if (currentStatus === 'running') {
        await client.query(
          "UPDATE workflow_runs SET status = 'cancelled', completed_at = NOW() WHERE task_id = $1 AND status = 'running'",
          [req.task.id]
        );
      }
    }

    const updated = await client.query(
      `UPDATE tasks
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           status = $3,
           updated_at = NOW()
       WHERE id = $4
       RETURNING id, workspace_id, title, description, status, created_by, created_at, updated_at`,
      [
        title === undefined ? null : title.trim(),
        description === undefined ? null : description,
        newStatus,
        req.task.id,
      ]
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

async function deleteTask(req, res) {
  const isManager = req.memberRole === 'Owner' || req.memberRole === 'Admin';
  const isCreator = req.task.created_by === req.user.id;

  if (!isManager && !isCreator) {
    return res.status(403).json({ message: 'Only the task creator, owners and admins can delete a task' });
  }
  if (req.task.status === 'running') {
    return res.status(409).json({ message: 'A running task cannot be deleted' });
  }

  try {
    await pool.query('DELETE FROM tasks WHERE id = $1', [req.task.id]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong' });
  }
}

module.exports = { createTask, listTasks, getTask, updateTask, deleteTask };
