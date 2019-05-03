const { Router } = require('express');
const isUUID = require('uuid-validate');
const { NotFoundError } = require('@asl/service/errors');

module.exports = () => {
  const router = Router({ mergeParams: true });

  router.put('/', (req, res, next) => {
    const taskId = req.params.taskId;

    if (!isUUID(taskId)) {
      throw new NotFoundError();
    }

    return req.workflow.task(taskId).extend({ comment: req.body.meta.comment })
      .then(response => {
        res.response = response;
        next();
      })
      .catch(next);
  });

  return router;
};
