const express = require('express');
const router = express.Router();
const {
  createWorkspace, listWorkspaces, getWorkspace, updateWorkspace, deleteWorkspace,
} = require('../controllers/workspaceController');
const {
  listMembers, inviteMember, removeMember, updateMemberRole, leaveWorkspace,
} = require('../controllers/memberController');
const { createTask, listTasks } = require('../controllers/taskController');
const verifyToken = require('../middleware/verifyToken');
const { requireWorkspaceMember } = require('../middleware/workspaceAccess');

router.use(verifyToken);

router.post('/', createWorkspace);
router.get('/', listWorkspaces);
router.get('/:id', requireWorkspaceMember, getWorkspace);
router.patch('/:id', requireWorkspaceMember, updateWorkspace);
router.delete('/:id', requireWorkspaceMember, deleteWorkspace);

router.get('/:id/members', requireWorkspaceMember, listMembers);
router.post('/:id/invite', requireWorkspaceMember, inviteMember);
router.patch('/:id/members/:memberId', requireWorkspaceMember, updateMemberRole);
router.delete('/:id/members/:memberId', requireWorkspaceMember, removeMember);
router.post('/:id/leave', requireWorkspaceMember, leaveWorkspace);

router.post('/:id/tasks', requireWorkspaceMember, createTask);
router.get('/:id/tasks', requireWorkspaceMember, listTasks);

module.exports = router;
