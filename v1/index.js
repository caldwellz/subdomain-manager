const { Router } = require('express');
const router = Router();

router.use('/update', require('./update.js'));

module.exports = router;
