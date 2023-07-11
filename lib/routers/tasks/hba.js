const { Router } = require('express');

module.exports = () => {
  const router = Router({ mergeParams: true });

  router.post('/', async (req, res, next) => {
    const { taskId } = req.params;
    const { hbaToken } = req.body.data;

    return req.workflow
      .task(taskId)
      .attachHba({ hbaToken })
      .then((response) => {
        res.response = response.json.data;
        next();
      })
      .catch(next);
  });

  router.delete('/', async (req, res, next) => {
    const { taskId } = req.params;

    return req.workflow
      .task(taskId)
      .deleteHba()
      .then((response) => {
        res.response = response.json.data;
        next();
      })
      .catch(next);
  });

  return router;
};
