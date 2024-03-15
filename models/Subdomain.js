const db = require('../db.js');

const dnsRecordSchema = new db.Schema({
  local: Boolean,
  record_id: String,
  type: String,
  value: String,
});

const subdomainSchema = new db.Schema(
  {
    active: Boolean,
    dnsRecords: [dnsRecordSchema],
    host: String,
    owner: {
      type: db.Schema.Types.ObjectId,
      ref: 'User',
    },
    reserved: Boolean,
  },
  { timestamps: true }
);

subdomainSchema.methods.getOwner = async function () {
  await this.populate('owner');
  return this.owner;
};

subdomainSchema.methods.setOwner = function (user) {
  // Support either raw or transformed User objects
  const { _id, id } = user;
  this.owner = _id || id;
};

module.exports = db.model('Subdomain', subdomainSchema);
