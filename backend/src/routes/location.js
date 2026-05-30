const router = require('express').Router();
const { query, validationResult } = require('express-validator');
const { reverseGeocode } = require('../utils/geocode');

const coordRules = [
  query('lat')
    .isFloat({ min: -90,  max: 90  }).withMessage('lat must be between -90 and 90.'),
  query('lng')
    .isFloat({ min: -180, max: 180 }).withMessage('lng must be between -180 and 180.'),
];

// GET /api/location/reverse-geocode?lat=5.6037&lng=-0.1870
router.get('/reverse-geocode', coordRules, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(422).json({ errors: errors.array() });

  const { lat, lng } = req.query;
  const result = await reverseGeocode(parseFloat(lat), parseFloat(lng));

  if (!result)
    return res.status(502).json({ message: 'Could not resolve location. Try again.' });

  // Return the full location object ready to POST with the report
  res.json({
    location: {
      type:        'Point',
      coordinates: [parseFloat(lng), parseFloat(lat)],
      ...result,
    },
  });
});

const constituencies = require('../config/constituencies');

// GET /api/location/constituencies
router.get('/constituencies', (req, res) => {
  res.json({ constituencies });
});

module.exports = router;
