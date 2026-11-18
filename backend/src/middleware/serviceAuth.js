const crypto = require('crypto');

function serviceAuth(req, res, next) {
  const expected = process.env.SERVICE_API_KEY;
  if (!expected) {
    return res.status(503).json({ message: 'Service authentication is not configured' });
  }

  const provided = req.headers['x-service-key'];
  if (typeof provided !== 'string') {
    return res.status(401).json({ message: 'Service key missing' });
  }

  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(401).json({ message: 'Invalid service key' });
  }

  next();
}

module.exports = serviceAuth;
