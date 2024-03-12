const { NODE_ENV = 'development' } = process.env;
require('dotenv').config({
  path: [`.env.${NODE_ENV}.local`, '.env.local', `.env.${NODE_ENV}`, '.env'],
});

const { APP_HOST, APP_PORT } = process.env;
const { apiKeyValidator } = require('./lib.js');
const db = require('./db.js');
const express = require('express');
const helmet = require('helmet');
const app = express();
const table = db.table('ApiKeys');

app.use(helmet());

// Content type and API key validation hook
app.use(async (req, res, next) => {
  // We only return JSON for now
  if (!req.accepts('json')) return res.sendStatus(406);

  // Local development bypass
  if (NODE_ENV === 'development' && req.ip === '127.0.0.1') {
    req.user = { active: true, role: 'superadmin' };
    return next();
  }

  // Check for a valid apiKey
  const apiKey = String(req.query.apiKey);
  try {
    if (apiKeyValidator.test(apiKey)) {
      req.user = await table.get(apiKey); // This will throw a LEVEL_NOT_FOUND error if the key doesn't exist
      if (!req.user.active) return res.sendStatus(403);
      return next();
    } else console.log(`Received invalid API key '${apiKey}' from ${req.ip}.`);
  } catch (err) {
    console.log(`Received unknown API key '${apiKey}' from ${req.ip}.`);
  }
  res.sendStatus(401);
});

app.use('/v1', require('./v1'));

app.use((req, res) => {
  res.sendStatus(404);
});

app.listen(APP_PORT, APP_HOST, async () => {
  await db.open();
  console.log(`Server running on ${APP_HOST}:${APP_PORT} in ${NODE_ENV} mode.`);
});
