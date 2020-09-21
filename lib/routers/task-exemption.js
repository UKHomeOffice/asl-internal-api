const { Router } = require('express');
const isUUID = require('uuid-validate');
const { NotFoundError, UnauthorisedError } = require('@asl/service/errors');

module.exports = () => {
  const router = Router({ mergeParams: true });

  router.put('/', (req, res, next) => {
    const taskId = req.params.taskId;

    if (!isUUID(taskId)) {
      throw new NotFoundError();
    }

    if (!req.user.profile.asruSupport) {
      throw new UnauthorisedError();
    }

    const { isExempt, reason } = req.body.data;

    return req.workflow.task(taskId).exemption({ isExempt, reason })
      .then(response => {
        res.response = response;
        next();
      })
      .catch(next);
  });

  return router;
};
