const { NODE_ENV = "development" } = process.env;
require("dotenv").config({
  path: [".env", `.env.${NODE_ENV}`, ".env.local", `.env.${NODE_ENV}.local`],
});

const { APP_HOST = "0.0.0.0", APP_PORT = 4242 } = process.env;
const express = require("express");
const helmet = require("helmet");
const app = express();

app.use(helmet());

app.get("/", (req, res) => {
  res.send("Hello world!");
});

app.listen(APP_PORT, APP_HOST, () => {
  console.log(`Server running on ${APP_HOST}:${APP_PORT} in ${NODE_ENV} mode.`);
});
