const { Router } = require('express');

const getAllAsruProfiles = req => {
  const { Profile } = req.models;
  return Profile.getAsruProfiles(req.query);
};

module.exports = () => {
  const router = Router();

  router.get('/', (req, res, next) => {
    Promise.resolve()
      .then(() => getAllAsruProfiles(req))
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
