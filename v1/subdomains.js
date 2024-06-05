const { celebrate, Joi } = require('celebrate');
const { getPublicIP } = require('../lib.js');
const { namesilo } = require('../registrars');
const { Router } = require('express');
const Subdomain = require('../models/Subdomain.js');
const router = Router();

router.get(
  '/',
  celebrate(
    {
      query: Joi.object({
        active: Joi.boolean(),
        host: Joi.string().domain({ allowUnicode: false, tlds: false }),
        reserved: Joi.boolean(),
      }),
    },
    { stripUnknown: true }
  ),
  async (req, res) => {
    const subdomains = await Subdomain.find(
      { ...req.query, owner: req.user._id },
      '-_id active host reserved dnsRecords.local dnsRecords.record_id dnsRecords.type dnsRecords.value'
    );
    res.json({ success: true, subdomains });
  }
);

router.get(
  '/liveRecords',
  celebrate(
    {
      query: Joi.object({
        active: Joi.boolean(),
        host: Joi.string().domain({ allowUnicode: false, tlds: false }),
        reserved: Joi.boolean(),
      }),
    },
    { stripUnknown: true }
  ),
  async (req, res) => {
    const domains = await namesilo.getAllDomainInfo();
    const localDomainList = Object.keys(domains).filter((name) => domains[name].traffic_type === 'Custom DNS');
    const dnsList = await namesilo.dnsListRecords(localDomainList);
    const records = dnsList.filter(({ type, value }) => type === 'A');
    res.json({ success: true, records });
  }
);

router.post(
  '/update',
  celebrate(
    {
      body: Joi.object({
        from: Joi.string(),
        to: Joi.string(),
        ttl: Joi.number().default(3603),
      }).required(),
    },
    { stripUnknown: true }
  ),
  async (req, res) => {
    const { from, to, ttl } = req.body;
    const value = to ?? (await getPublicIP());
    const subdomains = await Subdomain.find({ owner: req.user._id, 'dnsRecords.value': from });

    for (const sub of subdomains) {
      const { dnsRecords, host } = sub;
      for (const record of dnsRecords) {
        let { record_id: oldRecordId, value: oldValue } = record;
        if (oldValue === from) {
          try {
            // if (oldRecordId === '08e1c239ee49a6475c534cae9bf5f24f') oldRecordId = '010f4116d39007fc59bf59401314e59b';
            const { record_id } = await namesilo.dnsUpdateRecord({ record_id: oldRecordId, host, value, ttl });
            record.record_id = record_id;
            record.value = value;
          } catch (err) {
            console.error(err);
          }
        }
      }
      await sub.save();
    }
    res.json({ success: true, subdomains });
  }
);

module.exports = router;
