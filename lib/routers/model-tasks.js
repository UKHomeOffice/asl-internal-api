const { Router } = require('express');

module.exports = () => {
  const app = Router();

  app.get('/:modelId', (req, res, next) => {
    const { action, status, orderBy } = req.query;
    req.workflow.modelTasks(req.params.modelId, { action, status, orderBy })
      .then(response => {
        res.response = response.json.data;
      })
      .then(() => next())
      .catch(next);
  });

  return app;
};
