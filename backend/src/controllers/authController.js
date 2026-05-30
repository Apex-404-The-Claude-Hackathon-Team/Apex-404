const { validationResult } = require('express-validator');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const {
  signAccess, signRefresh, verifyRefresh,
  hashToken, REFRESH_COOKIE_OPTIONS,
} = require('../utils/token');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const tokenPayload = (user) => ({
  id:               user._id,
  role:             user.role,
  isVerifiedVoter:  user.isVerifiedVoter ?? false,
});

const sendTokens = async (res, user, statusCode = 200) => {
  const refreshToken = signRefresh(tokenPayload(user));
  user.refreshToken = hashToken(refreshToken);
  await user.save({ validateBeforeSave: false });

  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

  res.status(statusCode).json({
    accessToken: signAccess(tokenPayload(user)),
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      organization: user.organization,
      constituency: user.constituency,
      isVerifiedVoter:         user.isVerifiedVoter,
      voterVerificationStatus: user.voterVerificationStatus,
    },
  });
};

exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(422).json({ errors: errors.array() });

  const { firstName, lastName, email, password, organization, constituency } = req.body;

  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ message: 'Email already registered.' });

  const user = await User.create({ firstName, lastName, email, password, organization, constituency });
  await sendTokens(res, user, 201);
};

exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(422).json({ errors: errors.array() });

  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password +refreshToken');
  if (!user) return res.status(401).json({ message: 'Invalid credentials.' });

  if (!user.isActive)
    return res.status(403).json({ message: 'Account is deactivated.' });

  const valid = await user.comparePassword(password);
  if (!valid) return res.status(401).json({ message: 'Invalid credentials.' });

  await sendTokens(res, user);
};

exports.refresh = async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) return res.status(401).json({ message: 'No refresh token.' });

  let payload;
  try {
    payload = verifyRefresh(token);
  } catch {
    return res.status(401).json({ message: 'Invalid or expired refresh token.' });
  }

  const user = await User.findById(payload.id).select('+refreshToken');
  if (!user || user.refreshToken !== hashToken(token))
    return res.status(401).json({ message: 'Refresh token revoked.' });

  await sendTokens(res, user);
};

exports.logout = async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    const user = await User.findById(req.user?.id).select('+refreshToken');
    if (user) {
      user.refreshToken = null;
      await user.save({ validateBeforeSave: false });
    }
  }
  res.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS);
  res.json({ message: 'Logged out.' });
};

exports.getMe = async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json({ user });
};

exports.googleAuth = async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ message: 'ID token required.' });

  let ticket;
  try {
    ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
  } catch {
    return res.status(401).json({ message: 'Invalid Google token.' });
  }

  const { sub: googleId, email, given_name: firstName, family_name: lastName, email_verified } = ticket.getPayload();

  if (!email_verified) return res.status(401).json({ message: 'Google email not verified.' });

  // Find by googleId first, then fall back to email to link existing local accounts
  let user = await User.findOne({ googleId });

  if (!user) {
    user = await User.findOne({ email });
    if (user) {
      user.googleId     = googleId;
      user.authProvider = 'google';
      await user.save({ validateBeforeSave: false });
    } else {
      user = await User.create({
        firstName,
        lastName: lastName ?? '',
        email,
        googleId,
        authProvider: 'google',
      });
    }
  }

  if (!user.isActive) return res.status(403).json({ message: 'Account is deactivated.' });

  await sendTokens(res, user);
};
