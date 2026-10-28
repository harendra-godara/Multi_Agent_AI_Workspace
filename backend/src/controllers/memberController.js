const pool = require('../config/db');

const CAN_INVITE = ['Owner', 'Admin'];
const INVITABLE_ROLES = ['Member', 'Admin'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function listMembers(req, res) {
  try {
    const result = await pool.query(
      `SELECT wm.id,
              COALESCE(u.name, split_part(wm.email, '@', 1)) AS name,
              wm.email, wm.role, wm.status
       FROM workspace_members wm
       LEFT JOIN users u ON u.id = wm.user_id
       WHERE wm.workspace_id = $1
       ORDER BY wm.created_at ASC`,
      [req.workspaceId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong' });
  }
}

async function inviteMember(req, res) {
  try {
    if (!CAN_INVITE.includes(req.memberRole)) {
      return res.status(403).json({ message: 'Only owners and admins can invite members' });
    }

    const rawEmail = req.body.email;
    const role = req.body.role === undefined ? 'Member' : req.body.role;

    if (typeof rawEmail !== 'string' || !EMAIL_REGEX.test(rawEmail.trim())) {
      return res.status(400).json({ message: 'A valid email is required' });
    }
    if (!INVITABLE_ROLES.includes(role)) {
      return res.status(400).json({ message: "Role must be 'Member' or 'Admin'" });
    }

    const email = rawEmail.trim().toLowerCase();

    const existing = await pool.query(
      'SELECT id FROM workspace_members WHERE workspace_id = $1 AND LOWER(email) = $2',
      [req.workspaceId, email]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'This email is already a member or has a pending invite' });
    }

    const userResult = await pool.query(
      'SELECT id, name FROM users WHERE LOWER(email) = $1',
      [email]
    );
    const invitedUser = userResult.rows[0];

    const insert = await pool.query(
      `INSERT INTO workspace_members (workspace_id, user_id, email, role, status)
       VALUES ($1, $2, $3, $4, 'Pending')
       RETURNING id, email, role, status`,
      [req.workspaceId, invitedUser ? invitedUser.id : null, email, role]
    );

    res.status(201).json({
      ...insert.rows[0],
      name: invitedUser ? invitedUser.name : email.split('@')[0],
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ message: 'This email is already a member or has a pending invite' });
    }
    console.error(err);
    res.status(500).json({ message: 'Something went wrong' });
  }
}

module.exports = { listMembers, inviteMember };
