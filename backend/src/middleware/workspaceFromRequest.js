const { requireWorkspaceMember } = require('./workspaceAccess');

// For flat routes like GET /api/tasks?workspaceId=... and POST /api/tasks {workspaceId, ...}.
// Reuses requireWorkspaceMember by presenting the id as req.params.id.
function requireWorkspaceFromRequest(req, res, next) {
  const id = (req.body && req.body.workspaceId) || req.query.workspaceId;
  if (typeof id !== 'string' || id === '') {
    return res.status(400).json({ message: 'workspaceId is required' });
  }
  req.params.id = id;
  return requireWorkspaceMember(req, res, next);
}

module.exports = { requireWorkspaceFromRequest };
