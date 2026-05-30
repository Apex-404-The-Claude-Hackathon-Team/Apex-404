const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const authRoutes         = require('./routes/auth');
const postRoutes         = require('./routes/posts');
const locationRoutes     = require('./routes/location');
const projectRoutes      = require('./routes/projects');
const dashboardRoutes    = require('./routes/dashboard');
const mpRoutes           = require('./routes/mp');
const aiRoutes           = require('./routes/ai');
const verificationRoutes = require('./routes/verification');
const notificationRoutes = require('./routes/notifications');

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_ORIGIN,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const geoLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30, // 30 lookups/min per IP — stays within Nominatim's 1 req/s guideline
  message: { message: 'Too many location requests, slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth',         authLimiter, authRoutes);
app.use('/api/posts',        postRoutes);
app.use('/api/location',     geoLimiter,  locationRoutes);
app.use('/api/projects',     projectRoutes);
app.use('/api/dashboard',    dashboardRoutes);
app.use('/api/mp',           mpRoutes);
app.use('/api/ai',           aiRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error.' });
});

module.exports = app;
