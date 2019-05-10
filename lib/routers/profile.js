const { Router } = require('express');
const { NotFoundError, UnauthorisedError } = require('@asl/service/errors');

const permissions = require('../middleware/permissions');
const whitelist = require('../middleware/whitelist');

const notSelf = () => (req, res, next) => {
  if (req.user.profile.id === req.profile.id) {
    throw new UnauthorisedError();
  }
  next();
};

const update = () => (req, res, next) => {
  const params = {
    model: 'profile',
    id: req.profile.id,
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
      .eager('[roles.places, establishments, pil, projects, certificates, exemptions, asru(orderByName)]', {
        orderByName: (builder) => {
          builder.orderBy('name');
        }
      })
      .then(profile => {
        if (!profile) {
          return next(new NotFoundError());
        }
        req.profile = profile;
        next();
      });
  });

  router.put('/:profileId',
    permissions('admin'),
    whitelist('asruUser', 'asruAdmin', 'asruLicensing', 'asruInspector'),
    notSelf(),
    update()
  );

  router.get('/:profileId', (req, res, next) => {
    res.response = req.profile;
    next();
  });

  return router;

};
