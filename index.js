const { NODE_ENV = 'development' } = process.env;
require('dotenv').config({
  path: [`.env.${NODE_ENV}.local`, '.env.local', `.env.${NODE_ENV}`, '.env'],
});

const { APP_HOST, APP_PORT } = process.env;
const { celebrate, errors: celebrateErrorHandler, Joi } = require('celebrate');
const User = require('./models/User.js');
const db = require('./db.js');
const express = require('express');
const helmet = require('helmet');
const app = express();

app.use(helmet(), express.json());

// Content type and API key validation hooks
app.use(
  celebrate({
    headers: Joi.object({
      'x-api-key': Joi.string().hex().length(32).default(''),
    }).unknown(true),
  }),
  async (req, res, next) => {
    // We only return JSON for now
    if (!req.accepts('json')) return res.sendStatus(406);

    // Check for a valid apiKey
    const { 'x-api-key': apiKeys } = req.headers;
    req.user = await User.findOne({ apiKeys });
    if (!req.user?.active) {
      // Local development bypass
      if (NODE_ENV === 'development' && req.ip === '127.0.0.1') {
        req.user = new User({ roles: ['admin', 'user'], username: '' });
      } else {
        console.log(`Received invalid API key '${apiKeys}' from ${req.ip}`);
        return res.status(401).json({ success: false, error: 'Unauthenticated', message: 'Invalid API key' });
      }
    }
    next();
  }
);

app.use('/v1', require('./v1'));

// Route not found handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Not Found' });
});

// Validation and catch-all error handlers
app.use(celebrateErrorHandler(), (err, req, res, next) => {
  console.error('500 Server Error:', err);
  res.status(500).json({ success: false, error: 'Internal Server Error' });
});

app.listen(APP_PORT, APP_HOST, async () => {
  await db.open();
  console.log(`Server running on ${APP_HOST}:${APP_PORT} in ${NODE_ENV} mode.`);
});
