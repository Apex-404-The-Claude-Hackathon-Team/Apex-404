const { verifyAccess } = require('../utils/token');

exports.protect = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer '))
    return res.status(401).json({ message: 'No access token.' });

  try {
    req.user = verifyAccess(header.split(' ')[1]);
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired access token.' });
  }
};

exports.authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return res.status(403).json({ message: 'Insufficient permissions.' });
  next();
};
