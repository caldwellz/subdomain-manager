const { DB_PATH_PREFIX } = process.env;
const { Level } = require('level');

const db = new Level(`${DB_PATH_PREFIX}/subdomain-manager`);

if (!db.supports.encodings.json || !db.supports.encodings.utf8 || !db.supports.permanence || !db.supports.promises) {
  throw new Error(`Missing required database features! Support manifest: ${JSON.stringify(db.supports, null, 4)}`);
}

module.exports = {
  open: () => db.open(),
  table: (name, valueEncoding = 'json') => db.sublevel(name, { separator: '\x1D', keyEncoding: 'utf8', valueEncoding }),
};
