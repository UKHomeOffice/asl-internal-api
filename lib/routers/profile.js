const { Router } = require('express');
const { NotFoundError } = require('@asl/service/errors');

module.exports = () => {

  const router = Router();

  router.param('profileId', (req, res, next, id) => {
    const { Profile } = req.models;

    return Profile.query().findOne({ id })
      .eager('[roles.places, establishments, pil, projects, certificates, exemptions]')
      .then(profile => {
        if (!profile) {
          return next(new NotFoundError());
        }
        req.profile = profile;
        next();
      });
  });

  router.get('/:profileId', (req, res, next) => {
    res.response = req.profile;
    next();
  });

  return router;

};
