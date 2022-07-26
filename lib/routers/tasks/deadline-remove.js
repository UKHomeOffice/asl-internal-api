const { Router } = require('express');
const { UnauthorisedError } = require('@asl/service/errors');

module.exports = () => {
  const router = Router({ mergeParams: true });

  router.put('/', (req, res, next) => {
    const taskId = req.params.taskId;

    if (!req.user.profile.asruInspector) {
      throw new UnauthorisedError();
    }

    return req.workflow.task(taskId).removeDeadline({ comment: req.body.meta.comment })
      .then(response => {
        res.response = response;
        next();
      })
      .catch(next);
  });

  return router;
};
