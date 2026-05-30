const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const signAccess = (payload) =>
  jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
  });

const signRefresh = (payload) =>
  jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
  });

const verifyAccess = (token) =>
  jwt.verify(token, process.env.JWT_ACCESS_SECRET);

const verifyRefresh = (token) =>
  jwt.verify(token, process.env.JWT_REFRESH_SECRET);

// Refresh tokens are stored hashed so a DB leak doesn't expose them.
const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};

module.exports = { signAccess, signRefresh, verifyAccess, verifyRefresh, hashToken, REFRESH_COOKIE_OPTIONS };
