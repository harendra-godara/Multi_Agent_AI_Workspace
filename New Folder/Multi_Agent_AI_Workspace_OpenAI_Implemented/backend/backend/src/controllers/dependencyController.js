const pool = require('../config/db');
const { UUID_REGEX } = require('../utils/validators');

async function listDependencies(req, res) {
  try {
    const result = await pool.query(
      `SELECT t.id, t.title, t.status
       FROM task_dependencies td
       JOIN tasks t ON t.id = td.depends_on_task_id
       WHERE td.task_id = $1
       ORDER BY t.created_at ASC`,
      [req.task.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong' });
  }
}

async function addDependency(req, res) {
  const { dependsOnTaskId } = req.body;

  if (typeof dependsOnTaskId !== 'string' || !UUID_REGEX.test(dependsOnTaskId)) {
    return res.status(400).json({ message: 'dependsOnTaskId must be a valid task id' });
  }
  if (dependsOnTaskId === req.task.id) {
    return res.status(400).json({ message: 'A task cannot depend on itself' });
  }
  if (req.task.status !== 'pending') {
    return res.status(409).json({ message: 'Dependencies can only be changed while the task is pending' });
  }

  try {
    const target = await pool.query(
      'SELECT id FROM tasks WHERE id = $1 AND workspace_id = $2',
      [dependsOnTaskId, req.workspaceId]
    );
    if (target.rows.length === 0) {
      return res.status(404).json({ message: 'Dependency task not found' });
    }

    const duplicate = await pool.query(
      'SELECT 1 FROM task_dependencies WHERE task_id = $1 AND depends_on_task_id = $2',
      [req.task.id, dependsOnTaskId]
    );
    if (duplicate.rows.length > 0) {
      return res.status(409).json({ message: 'This dependency already exists' });
    }

    // Adding "task -> dependsOn" creates a cycle if dependsOn already (transitively) depends on task.
    const cycle = await pool.query(
      `WITH RECURSIVE chain AS (
         SELECT depends_on_task_id FROM task_dependencies WHERE task_id = $1
         UNION
         SELECT td.depends_on_task_id
         FROM task_dependencies td
         JOIN chain c ON td.task_id = c.depends_on_task_id
       )
       SELECT 1 FROM chain WHERE depends_on_task_id = $2 LIMIT 1`,
      [dependsOnTaskId, req.task.id]
    );
    if (cycle.rows.length > 0) {
      return res.status(409).json({ message: 'This dependency would create a circular dependency' });
    }

    await pool.query(
      'INSERT INTO task_dependencies (task_id, depends_on_task_id) VALUES ($1, $2)',
      [req.task.id, dependsOnTaskId]
    );

    res.status(201).json({ taskId: req.task.id, dependsOnTaskId });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ message: 'This dependency already exists' });
    }
    console.error(err);
    res.status(500).json({ message: 'Something went wrong' });
  }
}

async function removeDependency(req, res) {
  const { dependsOnId } = req.params;

  if (!UUID_REGEX.test(dependsOnId)) {
    return res.status(404).json({ message: 'Dependency not found' });
  }
  if (req.task.status !== 'pending') {
    return res.status(409).json({ message: 'Dependencies can only be changed while the task is pending' });
  }

  try {
    const deleted = await pool.query(
      'DELETE FROM task_dependencies WHERE task_id = $1 AND depends_on_task_id = $2 RETURNING id',
      [req.task.id, dependsOnId]
    );
    if (deleted.rows.length === 0) {
      return res.status(404).json({ message: 'Dependency not found' });
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong' });
  }
}

module.exports = { listDependencies, addDependency, removeDependency };
