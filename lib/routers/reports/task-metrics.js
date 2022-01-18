const { Router } = require('express');

module.exports = settings => {
  const router = Router({ mergeParams: true });

  router.use('/', (req, res, next) => {
    const { Export } = req.models;
    return Export.query()
      .where({ type: 'task-metrics', ready: true })
      .orderBy('key', 'desc')
      .then(result => {
        res.response = result;
      })
      .then(() => next())
      .catch(next);
  });

  router.get('/:exportId', (req, res, next) => {
    const { Export } = req.models;
    return Export.query()
      .findById(req.params.exportId)
      .where({ type: 'task-metrics', ready: true })
      .then(result => {
        res.response = result;
      })
      .then(() => next())
      .catch(next);
  });

  return router;
};
