const { DB_PREFIX, DB_HOST, DB_PORT } = process.env;
const mongoose = require('mongoose');

mongoose.open = async function () {
  const connectionStr = `mongodb://${DB_HOST}:${DB_PORT}/${DB_PREFIX}subdomain_manager`;
  await mongoose.connect(connectionStr);
  console.log('Successfully connected to', connectionStr);
};

module.exports = mongoose;
