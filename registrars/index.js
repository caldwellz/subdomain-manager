const names = ['namesilo'];

const registrars = {};
for (const name of names) {
  registrars[name] = require(`./${name}.js`);
}
module.exports = registrars;
