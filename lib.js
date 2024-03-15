const { IP_ECHO_SERVICE = 'https://ident.me/', RESERVED_SUBDOMAINS = '' } = process.env;
const crypto = require('node:crypto');
const { promisify } = require('node:util');

const randomBytes = promisify(crypto.randomBytes);
const reservedSubdomainsList = RESERVED_SUBDOMAINS.split(',');

async function getPublicIP() {
  let ip;
  try {
    const response = await fetch(IP_ECHO_SERVICE);
    ip = await response.text();
  } catch (err) {
    console.error(`Failed to fetch from echo service '${IP_ECHO_SERVICE}': ${err}`);
    const response = await fetch('https://tnedi.me/');
    ip = await response.text();
  }
  return ip;
}

/** Returns a string of random hex characters with an even length >= charCount. */
async function randomHex(charCount) {
  const bytes = await randomBytes(Math.round(charCount / 2));
  return bytes.toString('hex');
}

function splitHost(host) {
  const hostParts = host.split('.');
  const rrhost = hostParts.slice(0, -2).join('.');
  const domain = hostParts.slice(-2).join('.');
  return { rrhost, domain };
}

module.exports = {
  genApiKey: () => randomHex(32),
  getPublicIP,
  isReservedSubdomain: (host) => reservedSubdomainsList.includes(splitHost(host).rrhost),
  randomHex,
  splitHost,
};
