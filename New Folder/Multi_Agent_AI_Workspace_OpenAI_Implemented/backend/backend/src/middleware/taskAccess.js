const pool = require('../config/db');
const { UUID_REGEX } = require('../utils/validators');

async function requireTaskAccess(req, res, next) {
  const taskId = req.params.taskId;

  if (!UUID_REGEX.test(taskId)) {
    return res.status(404).json({ message: 'Task not found' });
  }

  try {
    const result = await pool.query(
      `SELECT t.id, t.workspace_id, t.title, t.description, t.status, t.created_by,
              t.created_at, t.updated_at, wm.role AS member_role
       FROM tasks t
       JOIN workspace_members wm
         ON wm.workspace_id = t.workspace_id AND wm.user_id = $2 AND wm.status = 'Active'
       WHERE t.id = $1`,
      [taskId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const { member_role, ...task } = result.rows[0];
    req.task = task;
    req.workspaceId = task.workspace_id;
    req.memberRole = member_role;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong' });
  }
}

module.exports = { requireTaskAccess };
