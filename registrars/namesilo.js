const { NAMESILO_API_KEY, NAMESILO_PAYMENT_ID } = process.env;
const { XMLParser } = require('fast-xml-parser');
const { apiKeyValidator } = require('../lib');

if (!apiKeyValidator.test(NAMESILO_API_KEY)) {
  throw new Error('Invalid NAMESILO_API_KEY. Create a .env.local file and fill it in.');
}

const parser = new XMLParser({
  attributeNamePrefix: '',
  ignoreAttributes: false,
  ignoreDeclaration: true,
  textNodeName: '_text',
});

// Namesilo only allows 2 requests per second, so we have to rate-limit ourselves
const resolveQueue = [];
async function rateLimitedFetch(...params) {
  await new Promise((resolve) => resolveQueue.push(resolve));
  return await fetch(...params);
}
setInterval(() => resolveQueue.shift()?.(), 501);

async function requestV1(operation, params = {}) {
  const realParams = { version: 1, type: 'xml', key: NAMESILO_API_KEY, ...params };
  const encodedParams = Object.keys(realParams)
    .map((p) => `${p}=${realParams[p]}`)
    .join('&');
  const response = await rateLimitedFetch(`https://www.namesilo.com/apibatch/${operation}?${encodedParams}`);
  const xmlData = await response.text();
  const { reply = {} } = parser.parse(xmlData).namesilo ?? {};
  const { code, detail = response.statusText, ...data } = reply;
  if (code !== 300) throw new Error(`Namesilo '${operation}' request failed with ${code}: '${detail}'`);
  return data;
}

async function addAccountFunds(amount) {
  const { new_balance } = await requestV1('addAccountFunds', { amount, payment_id: NAMESILO_PAYMENT_ID });
  return new_balance;
}

async function dnsAddRecord(record) {
  const { type: rrtype, host, value: rrvalue, distance: rrdistance = 10, ttl: rrttl = 7207 } = record;
  const hostParts = host.split('.');
  const rrhost = hostParts.slice(0, -2).join('.');
  const domain = hostParts.slice(-2).join('.');
  const { record_id } = await requestV1('dnsAddRecord', { domain, rrtype, rrhost, rrvalue, rrdistance, rrttl });
  return { ...record, record_id, distance: rrdistance, ttl: rrttl };
}

async function dnsListRecords(domainNames) {
  if (typeof domainNames === 'string') domainNames = [domainNames];
  const data = await Promise.all(domainNames.map((domain) => requestV1('dnsListRecords', { domain })));
  return data.map(({ resource_record = [] }) => resource_record).flat();
}

async function dnsUpdateRecord(record) {
  const { record_id: rrid, host, value: rrvalue, distance: rrdistance, ttl: rrttl } = record;
  const hostParts = host.split('.');
  const rrhost = hostParts.slice(0, -2).join('.');
  const domain = hostParts.slice(-2).join('.');
  const { record_id } = await requestV1('dnsUpdateRecord', { domain, rrid, rrhost, rrvalue, rrdistance, rrttl });
  return { ...record, record_id };
}

async function getAccountBalance() {
  const { balance } = await requestV1('getAccountBalance');
  return balance;
}

async function getAllDNSRecords() {
  const allDomainNames = Object.keys(await listDomains());
  return await dnsListRecords(allDomainNames);
}

async function getAllDomainInfo() {
  const domainNames = Object.keys(await listDomains());
  const data = await Promise.all(domainNames.map((name) => getDomainInfo(name)));
  const domains = {};
  for (const domainIndex in domainNames) domains[domainNames[domainIndex]] = data[domainIndex];
  return domains;
}

async function getDomainInfo(domain) {
  const data = await requestV1('getDomainInfo', { domain });
  data.nameservers = (data.nameservers?.nameserver ?? []).map((ns) => ns._text);
  return data;
}

async function listDomains() {
  const data = await requestV1('listDomains');
  return (data?.domains?.domain ?? []).reduce((results, { _text, ...attrs }) => ({ ...results, [_text]: attrs }), {});
}

async function listOrders() {
  return await requestV1('listOrders');
}

module.exports = {
  addAccountFunds,
  dnsAddRecord,
  dnsListRecords,
  dnsUpdateRecord,
  getAccountBalance,
  getAllDNSRecords,
  getAllDomainInfo,
  getDomainInfo,
  listDomains,
  listOrders,
};
