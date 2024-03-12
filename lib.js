const { IP_ECHO_SERVICE = 'https://ident.me/', RESERVED_SUBDOMAINS = '' } = process.env;
const { v4: uuid } = require('uuid');

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

function splitHost(host) {
  const hostParts = host.split('.');
  const rrhost = hostParts.slice(0, -2).join('.');
  const domain = hostParts.slice(-2).join('.');
  return { rrhost, domain };
}

module.exports = {
  apiKeyValidator: /^[A-Fa-f0-9]{22}/,
  genApiKey: () => uuid().replaceAll('-', '').slice(0, 22),
  getPublicIP,
  isReservedSubdomain: (host) => reservedSubdomainsList.includes(splitHost(host).rrhost),
  splitHost,
};
