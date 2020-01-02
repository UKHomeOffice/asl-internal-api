const { Router } = require('express');
const whitelist = require('../middleware/whitelist');
const permissions = require('@asl/service/lib/middleware/permissions');
const pil = require('./pil');

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

const create = (req, res, next) => {
  const params = {
    model: 'establishment',
    data: req.body.data,
    meta: req.body.meta
  };

  return req.workflow.create(params)
    .then(response => {
      const task = response.json.data;
      res.response = task.data.establishment;
      next();
    });
};

module.exports = () => {
  const router = Router();

  router.post('/',
    permissions('establishment.create'),
    whitelist('name'),
    create
  );

  router.param('id', (req, res, next, id) => {
    req.establishmentId = id;
    next();
  });

  router.put('/:id/conditions',
    permissions('establishment.updateConditions'),
    whitelist('conditions'),
    update('update-conditions')
  );

  router.use('/:id/pil', pil());

  return router;
};
