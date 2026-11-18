const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function createSession(userId, token) {
  const { exp } = jwt.decode(token);
  await pool.query(
    'INSERT INTO auth_sessions (user_id, token_hash, expires_at) VALUES ($1, $2, to_timestamp($3))',
    [userId, hashToken(token), exp]
  );
}

async function isSessionActive(token) {
  const result = await pool.query(
    'SELECT 1 FROM auth_sessions WHERE token_hash = $1 AND revoked = FALSE AND expires_at > NOW()',
    [hashToken(token)]
  );
  return result.rows.length > 0;
}

async function revokeSession(token) {
  await pool.query('UPDATE auth_sessions SET revoked = TRUE WHERE token_hash = $1', [hashToken(token)]);
}

async function revokeAllSessions(userId) {
  await pool.query('UPDATE auth_sessions SET revoked = TRUE WHERE user_id = $1 AND revoked = FALSE', [userId]);
}

module.exports = { createSession, isSessionActive, revokeSession, revokeAllSessions };
