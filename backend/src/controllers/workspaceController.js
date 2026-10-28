const pool = require('../config/db');

async function createWorkspace(req, res) {
  const { name, description } = req.body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ message: 'Workspace name is required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const wsResult = await client.query(
      'INSERT INTO workspaces (name, description, owner_id) VALUES ($1, $2, $3) RETURNING id, name, description, created_at',
      [name.trim(), description || '', req.user.id]
    );
    const workspace = wsResult.rows[0];

    await client.query(
      "INSERT INTO workspace_members (workspace_id, user_id, email, role, status) VALUES ($1, $2, $3, 'Owner', 'Active')",
      [workspace.id, req.user.id, req.user.email]
    );

    await client.query('COMMIT');

    res.status(201).json({ ...workspace, role: 'Owner', members: 1 });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Something went wrong' });
  } finally {
    client.release();
  }
}

async function listWorkspaces(req, res) {
  try {
    const result = await pool.query(
      `SELECT w.id, w.name, w.description, w.created_at, wm.role,
              (SELECT COUNT(*) FROM workspace_members m WHERE m.workspace_id = w.id)::int AS members
       FROM workspaces w
       JOIN workspace_members wm ON wm.workspace_id = w.id
       WHERE wm.user_id = $1 AND wm.status = 'Active'
       ORDER BY w.created_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong' });
  }
}

module.exports = { createWorkspace, listWorkspaces };
