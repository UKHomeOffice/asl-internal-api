const { Router } = require('express');
const moment = require('moment');
const { NotFoundError } = require('@asl/service/errors');

module.exports = () => {
  const router = Router({ mergeParams: true });

  router.get('/pil-reviews', (req, res, next) => {
    const { PIL } = req.models;
    return Promise.resolve()
      .then(() => {
        return PIL.query()
          .eager('[profile,establishment]')
          .where('reviewDate', '<', moment().add(3, 'months').toISOString())
          .where({ status: 'active' });
      })
      .then(pils => {
        res.response = pils.map(pil => {
          return {
            licenceNumber: pil.licenceNumber,
            establishment: pil.establishment.name,
            licenceHolder: `${pil.profile.firstName} ${pil.profile.lastName}`,
            reviewDate: moment(pil.reviewDate).format('YYYY-MM-DD')
          };
        });
      })
      .then(() => next())
      .catch(next);
  });

  router.get('/', () => {
    throw new NotFoundError();
  });

  return router;
};
