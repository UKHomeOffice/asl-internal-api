const ids = require('./ids');

module.exports = models => {

  return Promise.resolve()
    .then(() => models.Establishment.query().insert([
      {
        id: ids.establishments.croydon,
        issueDate: '2018-01-01T12:00:00Z',
        name: 'University of Croydon',
        status: 'active'
      },
      {
        id: ids.establishments.marvell,
        issueDate: '2020-07-01T12:00:00Z',
        name: 'Marvell Pharmaceuticals',
        status: 'active'
      },
      {
        id: ids.establishments.inactive,
        name: 'Inactive establishment',
        status: 'inactive'
      }
    ]))
    .then(() => models.Profile.query().insertGraph([
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
      },
      {
        id: ids.profiles.bruceBanner,
        userId: 'bruceybaby',
        firstName: 'Bruce',
        lastName: 'Banner',
        email: 'bb@example.com',
        asruUser: false,
        roles: [ { establishmentId: ids.establishments.croydon, type: 'holc' } ],
        establishments: [ { id: ids.establishments.croydon, role: 'admin' } ]
      }
    ], { relate: true }));

};
