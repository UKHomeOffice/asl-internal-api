const { Router } = require('express');
const isUUID = require('uuid-validate');
const { NotFoundError } = require('@asl/service/errors');

const deadline = require('./deadline-passed');
const extend = require('./extend');
const exemption = require('./exemption');

module.exports = settings => {
  const app = Router({ mergeParams: true });

  app.param('taskId', (req, res, next, taskId) => {
    if (!isUUID(taskId)) {
      throw new NotFoundError();
    }
    next();
  });

  app.use('/deadline-passed', deadline());
  // skip remaining routers
  app.use('/deadline-passed', (req, res, next) => next('route'));

  app.use('/:taskId/extend', extend());

  app.use('/:taskId/exemption', exemption());

  return app;
};
