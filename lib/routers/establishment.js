const { Router } = require('express');
const whitelist = require('../middleware/whitelist');
const permissions = require('@asl/service/lib/middleware/permissions');

const update = action => (req, res, next) => {
  const params = {
    model: 'establishment',
    id: req.establishmentId,
    data: req.body.data,
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
  const router = Router();

  router.param('id', (req, res, next, id) => {
    req.establishmentId = id;
    next();
  });

  router.put('/:id/conditions',
    permissions('establishment.updateConditions'),
    whitelist('conditions'),
    update('update-conditions')
  );

  return router;
};
