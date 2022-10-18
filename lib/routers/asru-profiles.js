const { Router } = require('express');

const getAsruProfiles = req => {
  const { Profile } = req.models;
  const { asruStatus } = req.query;

  return asruStatus === 'current'
    ? Profile.getAsruProfiles(req.query)
    : Profile.getFormerAsruProfiles(req.query);
};

module.exports = () => {
  const router = Router();

  router.get('/', (req, res, next) => {
    Promise.resolve()
      .then(() => getAsruProfiles(req))
      .then(({ filters, total, profiles }) => {
        res.meta.filters = filters;
        res.meta.total = total;
        res.meta.count = profiles.total;
        res.response = profiles.results;
        next();
      })
      .catch(next);
  });

  return router;
};
