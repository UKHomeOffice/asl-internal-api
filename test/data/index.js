const ids = require('./ids');

module.exports = models => {

  return Promise.resolve()
    .then(() => models.Profile.query().insert([
      {
        id: ids.profiles.licensing,
        userId: 'licensing',
        firstName: 'Licensing',
        lastName: 'Officer',
        email: 'licensing@example.com',
        asruUser: true,
        asruLicensing: true
      },
      {
        id: ids.profiles.inspector,
        userId: 'inspector',
        firstName: 'Inspector',
        lastName: 'Gadget',
        email: 'inspector@example.com',
        asruUser: true,
        asruInspector: true
      },
      {
        id: ids.profiles.rops,
        userId: 'rops',
        firstName: 'Roptimus',
        lastName: 'Prime',
        email: 'rops@example.com',
        asruUser: true,
        asruRops: true
      }
    ]));

};
