const express = require('express');
const router = express.Router();
const { createTask, listTasks, getTask, updateTask, deleteTask } = require('../controllers/taskController');
const { listDependencies, addDependency, removeDependency } = require('../controllers/dependencyController');
const { runTask, listRuns } = require('../controllers/runController');
const verifyToken = require('../middleware/verifyToken');
const { requireTaskAccess } = require('../middleware/taskAccess');
const { requireWorkspaceFromRequest } = require('../middleware/workspaceFromRequest');

router.use(verifyToken);

// Flat routes (workspaceId in query/body); the nested /api/workspaces/:id/tasks routes do the same thing.
router.get('/', requireWorkspaceFromRequest, listTasks);
router.post('/', requireWorkspaceFromRequest, createTask);

router.get('/:taskId', requireTaskAccess, getTask);
router.patch('/:taskId', requireTaskAccess, updateTask);
router.delete('/:taskId', requireTaskAccess, deleteTask);

router.get('/:taskId/dependencies', requireTaskAccess, listDependencies);
router.post('/:taskId/dependencies', requireTaskAccess, addDependency);
router.delete('/:taskId/dependencies/:dependsOnId', requireTaskAccess, removeDependency);

router.post('/:taskId/run', requireTaskAccess, runTask);
router.get('/:taskId/runs', requireTaskAccess, listRuns);

module.exports = router;
