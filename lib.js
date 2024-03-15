const { IP_ECHO_SERVICE = 'https://ident.me/', RESERVED_SUBDOMAINS = '' } = process.env;
const { promisify } = require('node:util');
const crypto = require('node:crypto');

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

function isReservedSubdomain(host) {
  const hostParts = host.split('.').slice(0, -2);
  if (!hostParts.length) return true; // Base domains are always reserved
  for (const part of hostParts) {
    if (reservedSubdomainsList.includes(part)) return true;
  }
  return false;
}

/** Returns a string of random hex characters with an even length >= charCount. */
async function randomHex(charCount) {
  const bytes = await randomBytes(Math.round(charCount / 2));
  return bytes.toString('hex');
}

function roundToPlaces(num, places = 1) {
  const multiplier = Math.pow(10, places);
  return Math.round(num * multiplier) / multiplier;
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
  isReservedSubdomain,
  randomHex,
  roundToPlaces,
  splitHost,
};
