const jwt = require('jsonwebtoken');
const { isSessionActive } = require('../utils/sessions');

async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication token missing' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!(await isSessionActive(token))) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    req.user = { id: decoded.id, email: decoded.email };
    req.token = token;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError' || err.name === 'NotBeforeError') {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    console.error(err);
    return res.status(500).json({ message: 'Something went wrong' });
  }
}

module.exports = verifyToken;
