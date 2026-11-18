const express = require('express');
const router = express.Router();
const { listMyInvites, acceptInvite, declineInvite } = require('../controllers/invitationController');
const verifyToken = require('../middleware/verifyToken');

router.use(verifyToken);

router.get('/', listMyInvites);
router.post('/:id/accept', acceptInvite);
router.post('/:id/decline', declineInvite);

module.exports = router;
