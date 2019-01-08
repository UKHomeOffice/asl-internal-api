const { Router } = require('express');
const { NotFoundError } = require('@asl/service/errors');

const update = () => (req, res, next) => {
  const params = {
    model: 'profile',
    id: req.params.profileId,
    data: req.body.data,
    meta: req.body.meta
  };

  req.workflow.update(params)
    .then(response => {
      res.response = response;
      next();
    })
    .catch(next);
};

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

  router.put('/:profileId', update());

  router.get('/:profileId', (req, res, next) => {
    res.response = req.profile;
    next();
  });

  return router;

};
