const { Router } = require('express');
const router = Router();

// Only admins can access this section of the API
router.use((req, res, next) => {
  const { role } = req.user;
  if (role === 'admin' || role === 'superadmin') return next();
  res.sendStatus(404);
});

router.use('/keys', require('./keys.js'));

module.exports = router;
