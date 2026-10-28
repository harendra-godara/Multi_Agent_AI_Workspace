const express = require('express');
const router = express.Router();
const { createWorkspace, listWorkspaces } = require('../controllers/workspaceController');
const { listMembers, inviteMember } = require('../controllers/memberController');
const verifyToken = require('../middleware/verifyToken');
const { requireWorkspaceMember } = require('../middleware/workspaceAccess');

router.use(verifyToken);

router.post('/', createWorkspace);
router.get('/', listWorkspaces);
router.get('/:id/members', requireWorkspaceMember, listMembers);
router.post('/:id/invite', requireWorkspaceMember, inviteMember);

module.exports = router;
