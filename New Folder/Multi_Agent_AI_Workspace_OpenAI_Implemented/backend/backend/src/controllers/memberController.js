const pool = require('../config/db');
const { UUID_REGEX, EMAIL_REGEX } = require('../utils/validators');

const CAN_INVITE = ['Owner', 'Admin'];
const INVITABLE_ROLES = ['Member', 'Admin'];

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

// Removes an active member, or cancels a pending invite.
async function removeMember(req, res) {
  const memberId = req.params.memberId;

  if (!CAN_INVITE.includes(req.memberRole)) {
    return res.status(403).json({ message: 'Only owners and admins can remove members' });
  }
  if (!UUID_REGEX.test(memberId)) {
    return res.status(404).json({ message: 'Member not found' });
  }

  try {
    const target = await pool.query(
      'SELECT id, role FROM workspace_members WHERE id = $1 AND workspace_id = $2',
      [memberId, req.workspaceId]
    );
    if (target.rows.length === 0) {
      return res.status(404).json({ message: 'Member not found' });
    }

    const { role } = target.rows[0];
    if (role === 'Owner') {
      return res.status(403).json({ message: 'The owner cannot be removed' });
    }
    if (req.memberRole === 'Admin' && role === 'Admin') {
      return res.status(403).json({ message: 'Admins cannot remove other admins' });
    }

    await pool.query('DELETE FROM workspace_members WHERE id = $1', [memberId]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong' });
  }
}

async function updateMemberRole(req, res) {
  const memberId = req.params.memberId;
  const { role } = req.body;

  if (req.memberRole !== 'Owner') {
    return res.status(403).json({ message: 'Only the owner can change roles' });
  }
  if (!UUID_REGEX.test(memberId)) {
    return res.status(404).json({ message: 'Member not found' });
  }
  if (!INVITABLE_ROLES.includes(role)) {
    return res.status(400).json({ message: "Role must be 'Member' or 'Admin'" });
  }

  try {
    const target = await pool.query(
      'SELECT id, role FROM workspace_members WHERE id = $1 AND workspace_id = $2',
      [memberId, req.workspaceId]
    );
    if (target.rows.length === 0) {
      return res.status(404).json({ message: 'Member not found' });
    }
    if (target.rows[0].role === 'Owner') {
      return res.status(403).json({ message: "The owner's role cannot be changed" });
    }

    const updated = await pool.query(
      'UPDATE workspace_members SET role = $1 WHERE id = $2 RETURNING id, email, role, status',
      [role, memberId]
    );
    res.json(updated.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong' });
  }
}

async function leaveWorkspace(req, res) {
  if (req.memberRole === 'Owner') {
    return res.status(403).json({ message: 'The owner cannot leave; delete the workspace instead' });
  }

  try {
    await pool.query(
      'DELETE FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
      [req.workspaceId, req.user.id]
    );
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong' });
  }
}

module.exports = { listMembers, inviteMember, removeMember, updateMemberRole, leaveWorkspace };
