const pool = require('../config/db');

const CAN_EDIT = ['Owner', 'Admin'];

async function createWorkspace(req, res) {
  const { name, description } = req.body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ message: 'Workspace name is required' });
  }
  if (name.trim().length > 150) {
    return res.status(400).json({ message: 'Workspace name must be 150 characters or less' });
  }
  if (description !== undefined && typeof description !== 'string') {
    return res.status(400).json({ message: 'Workspace description must be a string' });
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

async function getWorkspace(req, res) {
  try {
    const result = await pool.query(
      `SELECT w.id, w.name, w.description, w.owner_id, w.created_at,
              (SELECT COUNT(*) FROM workspace_members m WHERE m.workspace_id = w.id AND m.status = 'Active')::int AS members,
              (SELECT COUNT(*) FROM tasks t WHERE t.workspace_id = w.id)::int AS tasks
       FROM workspaces w
       WHERE w.id = $1`,
      [req.workspaceId]
    );

    res.json({ ...result.rows[0], role: req.memberRole });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong' });
  }
}

async function updateWorkspace(req, res) {
  if (!CAN_EDIT.includes(req.memberRole)) {
    return res.status(403).json({ message: 'Only owners and admins can edit the workspace' });
  }

  const { name, description } = req.body;

  if (name === undefined && description === undefined) {
    return res.status(400).json({ message: 'Provide name or description to update' });
  }
  if (name !== undefined && (typeof name !== 'string' || name.trim() === '' || name.trim().length > 150)) {
    return res.status(400).json({ message: 'Workspace name must be 1-150 characters' });
  }
  if (description !== undefined && typeof description !== 'string') {
    return res.status(400).json({ message: 'Workspace description must be a string' });
  }

  try {
    const result = await pool.query(
      `UPDATE workspaces
       SET name = COALESCE($1, name), description = COALESCE($2, description)
       WHERE id = $3
       RETURNING id, name, description, owner_id, created_at`,
      [name === undefined ? null : name.trim(), description === undefined ? null : description, req.workspaceId]
    );

    res.json({ ...result.rows[0], role: req.memberRole });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong' });
  }
}

async function deleteWorkspace(req, res) {
  if (req.memberRole !== 'Owner') {
    return res.status(403).json({ message: 'Only the owner can delete the workspace' });
  }

  try {
    await pool.query('DELETE FROM workspaces WHERE id = $1', [req.workspaceId]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong' });
  }
}

module.exports = { createWorkspace, listWorkspaces, getWorkspace, updateWorkspace, deleteWorkspace };
