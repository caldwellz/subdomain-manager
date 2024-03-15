const { isReservedSubdomain, getPublicIP } = require('../../lib');
const { namesilo } = require('../../registrars');
const { Router } = require('express');
const Subdomain = require('../../models/Subdomain.js');
const router = Router();

router.post('/claimUnownedSubdomains', async (req, res) => {
  const allSubdomains = {};
  const claimedSubdomains = {};
  const owner = req.user._id;
  const publicIP = await getPublicIP();
  const domainInfo = await namesilo.getAllDomainInfo();
  const nonForwardedDomains = Object.keys(domainInfo).filter((name) => domainInfo[name].traffic_type === 'Custom DNS');
  for (const domain of nonForwardedDomains) {
    const dnsRecords = await namesilo.dnsListRecords(domain);
    for (const rec of dnsRecords) {
      const { record_id, host, type, value } = rec;
      if (!allSubdomains[host]) {
        allSubdomains[host] = await Subdomain.findOne({ host });
        if (!allSubdomains[host]) {
          claimedSubdomains[host] = new Subdomain({
            active: true,
            dnsRecords: [],
            host,
            owner,
            reserved: isReservedSubdomain(host),
          });
          allSubdomains[host] = claimedSubdomains[host];
        }
      }
      if (!claimedSubdomains[host]) continue;
      const local = value === publicIP;
      claimedSubdomains[host].dnsRecords.push({
        local,
        record_id,
        type,
        value,
      });
    }
  }
  await Promise.all(Object.values(claimedSubdomains).map((sub) => sub.save()));
  res.json({ success: true, subdomains: Object.keys(claimedSubdomains) });
});

module.exports = router;
