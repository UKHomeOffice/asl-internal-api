const { Router } = require('express');
const isUUID = require('uuid-validate');
const { NotFoundError } = require('@asl/service/errors');

const deadline = require('./deadline-passed');
const filtered = require('./filtered');
const extend = require('./extend');
const removeDeadline = require('./deadline-remove');
const reinstateDeadline = require('./deadline-reinstate');
const exemption = require('./exemption');
const assign = require('./assign');

module.exports = settings => {
  const app = Router({ mergeParams: true });

  app.use('/deadline-passed', deadline());
  app.use('/filtered', filtered());

  app.param('taskId', (req, res, next, taskId) => {
    if (!isUUID(taskId)) {
      throw new NotFoundError();
    }
    next();
  });

  app.use('/:taskId/extend', extend());
  app.use('/:taskId/exemption', exemption());
  app.use('/:taskId/assign', assign());
  app.use('/:taskId/remove-deadline', removeDeadline());
  app.use('/:taskId/reinstate-deadline', reinstateDeadline());

  return app;
};
