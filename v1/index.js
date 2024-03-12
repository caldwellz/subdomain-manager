const { Router } = require('express');
const router = Router();

router.use('/admin', require('./admin'));
router.use('/update', require('./update.js'));

module.exports = router;
