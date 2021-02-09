const { Router } = require('express');

module.exports = () => {
  const router = Router({ mergeParams: true });

  router.get('/', (req, res, next) => {
    return req.workflow.filtered({ query: req.query })
      .then(response => {
        res.response = response.json.data;
        res.meta = response.json.meta;
        next();
      })
      .catch(next);
  });

  return router;
};
