const { Router } = require('express');

module.exports = () => {
  const router = Router({ mergeParams: true });

  router.put('/', (req, res, next) => {
    const { taskId } = req.params;
    const { profileId } = req.body.data;

    return req.workflow.task(taskId).assign({ profileId })
      .then(response => {
        res.response = response;
        next();
      })
      .catch(next);
  });

  return router;
};
