const { PWD_TIME_COST = 3, PWD_MEM_COST = 65536, PWD_PEPPER_KEY } = process.env;
const { genApiKey } = require('../lib.js');
const argon2 = require('argon2');
const db = require('../db.js');

const timeCost = parseInt(PWD_TIME_COST);
const memoryCost = parseInt(PWD_MEM_COST);
let pepper;
if (PWD_PEPPER_KEY) pepper = Buffer.from(PWD_PEPPER_KEY, 'hex');

const userSchema = new db.Schema(
  {
    active: Boolean,
    apiKeys: [String],
    passwordHash: String,
    roles: [String],
    username: String,
  },
  { timestamps: true }
);

userSchema.methods.addAPIKey = async function () {
  const key = await genApiKey();
  if (!Array.isArray(this.apiKeys)) this.apiKeys = [];
  this.apiKeys.push(key);
  return key;
};

userSchema.methods.hasRole = function (role) {
  return this.roles.includes(role);
};

userSchema.methods.updatePassword = async function (password) {
  this.passwordHash = await argon2.hash(password, {
    timeCost,
    memoryCost,
    secret: pepper,
  });
  return true;
};

userSchema.methods.verifyPassword = async function (password) {
  return await argon2.verify(this.passwordHash, password, { secret: pepper });
};

module.exports = db.model('User', userSchema);
