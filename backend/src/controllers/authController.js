const { validationResult } = require('express-validator');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const MPProfile = require('../models/MPProfile');
const constituencies = require('../config/constituencies');
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

exports.mpLogin = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(422).json({ errors: errors.array() });

  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password +refreshToken');
  if (!user) return res.status(401).json({ message: 'Invalid credentials.' });

  if (!user.isActive)
    return res.status(403).json({ message: 'Account is deactivated.' });

  if (user.role !== 'mp')
    return res.status(403).json({ message: 'Access denied. This login is reserved for Members of Parliament.' });

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

exports.mpRegister = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(422).json({ errors: errors.array() });

  const { firstName, lastName, email, password, constituency, secretKey } = req.body;

  // 1. Verify access key
  const expectedKey = process.env.MP_SECRET_KEY || 'GHANA_MP_2026';
  if (secretKey !== expectedKey) {
    return res.status(403).json({ message: 'Invalid MP verification access key.' });
  }

  // 2. Validate constituency exists and name matches the official record
  const match = constituencies.find(c => c.id === constituency);
  if (!match) {
    return res.status(400).json({ message: 'Invalid constituency selection.' });
  }

  const normalize = (name) =>
    name.replace(/\b(dr|hon|mr|mrs|ms|prof)\.?\s*/gi, '').toLowerCase().replace(/[-]/g, ' ').replace(/\s+/g, ' ').trim();

  const enteredName = normalize(`${firstName} ${lastName}`);
  const expectedName = normalize(match.mpName);

  if (enteredName !== expectedName) {
    return res.status(403).json({
      message: `Name does not match the official record for ${match.name} constituency. The registered MP is ${match.mpName}.`
    });
  }

  // 3. Check if email is already registered
  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ message: 'Email already registered.' });

  // 4. Check if constituency already has an MP
  const mpExists = await User.findOne({ role: 'mp', constituency });
  if (mpExists) {
    return res.status(409).json({ message: 'An MP is already registered for this constituency.' });
  }

  // 5. Create the MP User
  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    role: 'mp',
    constituency,
    isEmailVerified: true
  });

  // 6. Automatically create the corresponding MP Profile
  await MPProfile.create({
    user: user._id,
    constituency,
    party: match.party,
    bio: `Member of Parliament for ${match.name}. Dedicated to public transparency and community development.`,
    contactEmail: email,
    contactPhone: '+233 24 000 0000',
    profilePhoto: {
      url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80',
      publicId: 'default_mp_photo'
    },
    isVerified: true
  });

  await sendTokens(res, user, 201);
};
