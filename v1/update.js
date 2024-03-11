const { Router } = require('express');
const router = Router();

router.use('/', (req, res) => {
  res.send('Hello world!');
});

module.exports = router;
