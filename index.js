const { NODE_ENV = 'development' } = process.env;
require('dotenv').config({
  path: [`.env.${NODE_ENV}.local`, '.env.local', `.env.${NODE_ENV}`, '.env'],
});

const { APP_HOST, APP_PORT } = process.env;
const db = require('./db.js');
const express = require('express');
const helmet = require('helmet');
const app = express();

app.use(helmet());

app.use('/v1', require('./v1'));

app.use((req, res) => {
  res.sendStatus(404);
});

app.listen(APP_PORT, APP_HOST, async () => {
  await db.open();
  console.log(`Server running on ${APP_HOST}:${APP_PORT} in ${NODE_ENV} mode.`);
});
