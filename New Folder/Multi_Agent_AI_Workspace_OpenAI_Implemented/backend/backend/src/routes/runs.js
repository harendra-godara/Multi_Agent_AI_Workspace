const express = require('express');
const router = express.Router();
const { getRun, updateRun } = require('../controllers/runController');
const verifyToken = require('../middleware/verifyToken');
const serviceAuth = require('../middleware/serviceAuth');

router.get('/:runId', verifyToken, getRun);
router.patch('/:runId', serviceAuth, updateRun);

module.exports = router;
