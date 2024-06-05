const { namesilo } = require('../registrars');
const { Router } = require('express');
const { getPublicIP } = require('../lib.js');
const db = require('../db.js');

const githubPagesRegex = /^185\.199\.[0-9]{3}\.153$/;
const router = Router();
//const table = db.table('local');

// Gets this server's public IP
router.get('/add/:type?', async (req, res) => {
  const { type = 'A' } = req.params;
  const record = await namesilo.dnsAddRecord({
    type,
    host: 'notgonna.getresults.top',
    value: '73.131.230.186',
  });
  res.json(record);
});

// Gets this server's public IP
router.get('/public-ip', async (req, res) => {
  const ip = await getPublicIP();
  res.json({ ip });
});

// Gets this server's public IP and updates all "local" sites with it
router.get('/records/:recordType?', async (req, res) => {
  const { recordType } = req.params;
  const records = await namesilo.getAllDNSRecords();
  const typedRecords = recordType ? records.filter(({ type }) => type === recordType) : records;
  console.log(JSON.stringify(typedRecords, null, 4));
  res.json(typedRecords);
});

// Fetch this server's public IP and update all "local" sites with it
router.post('/update', async (req, res) => {
  const response = await fetch('https://tnedi.me/');
  const ip = await response.text();
  const domains = await namesilo.getAllDomainInfo();
  const localDomainList = Object.keys(domains).filter((name) => domains[name].traffic_type === 'Custom DNS');
  const dnsList = await namesilo.dnsListRecords(localDomainList);
  const localARecords = dnsList.filter(({ type, value }) => type === 'A' && !githubPagesRegex.test(value));
  const modifiedARecords = await Promise.all(localARecords.map((rec) => ({ ...rec, value: ip })));
  console.log(JSON.stringify(modifiedARecords, null, 4));
  res.json(modifiedARecords);
});

module.exports = router;
