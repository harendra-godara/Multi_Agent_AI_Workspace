const express = require('express');
const router = express.Router();
const { listMyInvites, acceptInvite } = require('../controllers/invitationController');
const verifyToken = require('../middleware/verifyToken');

router.use(verifyToken);

router.get('/', listMyInvites);
router.post('/:id/accept', acceptInvite);

module.exports = router;
