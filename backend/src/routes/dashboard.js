const router = require('express').Router();
const { query, param } = require('express-validator');
const { validationResult } = require('express-validator');
const {
  getConstituencyDashboard,
  getConstituencyReportStats,
} = require('../controllers/dashboardController');

const constituencyParam = param('constituency')
  .trim()
  .notEmpty()
  .withMessage('Constituency name is required.');

const dateRangeRules = [
  query('from').optional().isISO8601().withMessage('from must be a valid ISO date.'),
  query('to').optional().isISO8601().withMessage('to must be a valid ISO date.'),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
  next();
};

// GET /api/dashboard/:constituency
// Full dashboard: MP info, report stats, project stats, top issues, recent activity
router.get('/:constituency', constituencyParam, validate, getConstituencyDashboard);

// GET /api/dashboard/:constituency/reports?from=&to=
// Detailed report stats with monthly trend — supports date range filtering
router.get('/:constituency/reports', constituencyParam, dateRangeRules, validate, getConstituencyReportStats);

module.exports = router;
