const { Router } = require('express');
const router = Router();

router.use('/admin', require('./admin'));
router.use('/subdomains', require('./subdomains.js'));

module.exports = router;
