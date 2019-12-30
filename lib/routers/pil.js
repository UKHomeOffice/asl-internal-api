const { Router } = require('express');
const permissions = require('@asl/service/lib/middleware/permissions');
const whitelist = require('../middleware/whitelist');

const update = action => (req, res, next) => {
  const params = {
    model: 'pil',
    id: req.pilId,
    data: {
      ...req.body.data,
      establishmentId: req.pil.establishmentId,
      profileId: req.profile && req.profile.id
    },
    meta: req.body.meta,
    action
  };

  req.workflow.update(params)
    .then(response => {
      res.response = response;
      next();
    })
    .catch(next);
};

module.exports = () => {
  const app = Router({ mergeParams: true });

  app.param('pilId', (req, res, next, pilId) => {
    const { PIL } = req.models;
    return Promise.resolve()
      .then(() => PIL.query().findById(pilId))
      .then(pil => {
        req.pil = pil;
        req.pilId = pilId;
      })
      .then(() => next())
      .catch(next);
  });

  app.put('/:pilId/conditions',
    permissions('pil.updateConditions'),
    whitelist('conditions'),
    update('update-conditions')
  );

  app.put('/:pilId/billing',
    permissions('pil.updateBillable'),
    whitelist('billable'),
    update('set-billable')
  );

  return app;
};
