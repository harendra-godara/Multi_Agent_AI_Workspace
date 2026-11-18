const express = require('express');
const router = express.Router();
const { register, login, me, logout, logoutAll } = require('../controllers/authController');
const verifyToken = require('../middleware/verifyToken');

router.post('/register', register);
router.post('/login', login);
router.get('/me', verifyToken, me);
router.post('/logout', verifyToken, logout);
router.post('/logout-all', verifyToken, logoutAll);

module.exports = router;
