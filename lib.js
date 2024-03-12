const { IP_ECHO_SERVICE = 'https://ident.me/' } = process.env;
const { v4: uuid } = require('uuid');

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

module.exports = {
  apiKeyValidator: /^[A-Fa-f0-9]{22}/,
  genApiKey: () => uuid().replaceAll('-', '').slice(0, 22),
  getPublicIP,
};
