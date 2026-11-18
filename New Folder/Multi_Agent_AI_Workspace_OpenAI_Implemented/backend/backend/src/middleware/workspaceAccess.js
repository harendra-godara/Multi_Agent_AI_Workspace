const pool = require('../config/db');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function requireWorkspaceMember(req, res, next) {
  const workspaceId = req.params.id;

  if (!UUID_REGEX.test(workspaceId)) {
    return res.status(404).json({ message: 'Workspace not found' });
  }

  try {
    const result = await pool.query(
      "SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2 AND status = 'Active'",
      [workspaceId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    req.workspaceId = workspaceId;
    req.memberRole = result.rows[0].role;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong' });
  }
}

module.exports = { requireWorkspaceMember };
