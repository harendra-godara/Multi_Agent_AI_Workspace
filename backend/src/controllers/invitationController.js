const pool = require('../config/db');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function listMyInvites(req, res) {
  try {
    const result = await pool.query(
      `SELECT wm.id,
              wm.workspace_id AS "workspaceId",
              w.name AS "workspaceName",
              wm.role,
              wm.created_at AS "invitedAt"
       FROM workspace_members wm
       JOIN workspaces w ON w.id = wm.workspace_id
       WHERE wm.status = 'Pending'
         AND LOWER(wm.email) = (SELECT LOWER(email) FROM users WHERE id = $1)
       ORDER BY wm.created_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong' });
  }
}

async function acceptInvite(req, res) {
  const inviteId = req.params.id;

  if (!UUID_REGEX.test(inviteId)) {
    return res.status(404).json({ message: 'Invite not found' });
  }

  try {
    const updated = await pool.query(
      `UPDATE workspace_members
       SET status = 'Active', user_id = $1
       WHERE id = $2
         AND status = 'Pending'
         AND LOWER(email) = (SELECT LOWER(email) FROM users WHERE id = $1)
       RETURNING workspace_id, role`,
      [req.user.id, inviteId]
    );

    if (updated.rows.length === 0) {
      return res.status(404).json({ message: 'Invite not found' });
    }

    const { workspace_id, role } = updated.rows[0];

    const ws = await pool.query(
      `SELECT w.id, w.name, w.description, w.created_at,
              (SELECT COUNT(*) FROM workspace_members m WHERE m.workspace_id = w.id)::int AS members
       FROM workspaces w
       WHERE w.id = $1`,
      [workspace_id]
    );

    res.json({ ...ws.rows[0], role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong' });
  }
}

module.exports = { listMyInvites, acceptInvite };
