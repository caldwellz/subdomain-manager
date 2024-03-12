const { STATIC_IPS = '' } = process.env;
const { isReservedSubdomain, getPublicIP } = require('../../lib');
const { namesilo } = require('../../registrars');
const { Router } = require('express');
const db = require('../../db.js');
const subdomainTable = db.table('Subdomains');
const router = Router();
const staticIPsList = STATIC_IPS.split(',');

router.get('/refresh', async (req, res) => {
  const publicIP = await getPublicIP();
  const domainInfo = await namesilo.getAllDomainInfo();
  const nonForwardedDomains = Object.keys(domainInfo).filter((name) => domainInfo[name].traffic_type === 'Custom DNS');
  const dnsRecords = await namesilo.dnsListRecords(nonForwardedDomains);
  const addrRecords = dnsRecords.filter(({ type }) => type.startsWith('A'));
  const subdomains = {};
  for (const rec of addrRecords) {
    const { record_id, type, host, value } = rec;
    subdomains[host] = subdomains[host] ?? [];
    const local = value === publicIP;
    const static = staticIPsList.includes(value);
    const item = {
      record_id,
      type,
      value,
      local,
      static,
      allowedChangeRoles:
        local || static || isReservedSubdomain(host) ? ['admin', 'superadmin'] : ['user', 'admin', 'superadmin'],
    };
    subdomains[host].push(item);
  }
  await Promise.all(Object.keys(subdomains).map((host) => subdomainTable.put(host, subdomains[host])));
  res.json(subdomains);
});

module.exports = router;
