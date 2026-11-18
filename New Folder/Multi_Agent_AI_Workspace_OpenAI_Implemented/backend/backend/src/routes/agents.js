const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const { listAgents } = require('../controllers/agentController');

router.get('/', verifyToken, listAgents);

module.exports = router;
