const { genApiKey } = require('../../lib.js');
const { Router } = require('express');
const db = require('../../db.js');
const router = Router();
const keysTable = db.table('ApiKeys');

router.get('/create', async (req, res) => {
  const { role } = req.query;
  if (typeof role !== 'string') return res.status(400).send('Invalid role');

  const apiKey = genApiKey();
  await keysTable.put(apiKey, { active: true, role });
  res.json({ apiKey, role });
});

module.exports = router;
