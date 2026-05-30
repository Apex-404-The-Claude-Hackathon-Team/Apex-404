const router = require('express').Router();
const { body } = require('express-validator');
const { register, login, refresh, logout, getMe, googleAuth } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const registerRules = [
  body('firstName').trim().notEmpty().withMessage('First name is required.'),
  body('lastName').trim().notEmpty().withMessage('Last name is required.'),
  body('email').isEmail().withMessage('Valid email is required.').normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter.')
    .matches(/[0-9]/).withMessage('Password must contain a number.'),
];

const loginRules = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

router.post('/register',     registerRules, register);
router.post('/login',        loginRules,    login);
router.post('/google',                      googleAuth);
router.post('/refresh',                     refresh);
router.post('/logout',       protect,       logout);
router.get('/me',            protect,       getMe);

module.exports = router;
