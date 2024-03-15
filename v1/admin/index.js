const { Router } = require('express');
const router = Router();

// Only admins can access this section of the API
router.use((req, res, next) => {
  if (req.user?.hasRole?.('admin')) return next();
  res.status(403).json({ success: false, error: 'Unauthorized' });
});

router.use('/domains', require('./domains.js'));
router.use('/users', require('./users.js'));

module.exports = router;
