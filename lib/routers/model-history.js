const { Router } = require('express');

module.exports = () => {
  const app = Router();

  app.get('/:modelId', (req, res, next) => {
    const { action, status = 'autoresolved' } = req.query;
    req.workflow.modelHistory(req.params.modelId, { action, status })
      .then(response => {
        res.response = response.json.data;
      })
      .then(() => next())
      .catch(next);
  });

  return app;
}
