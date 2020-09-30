const { Router } = require('express');
const { UnauthorisedError } = require('@asl/service/errors');

module.exports = () => {
  const router = Router({ mergeParams: true });

  router.get('/', (req, res, next) => {
    if (!req.user.profile.asruSupport) {
      throw new UnauthorisedError();
    }

    return req.workflow.deadlinePassed({ query: req.query })
      .then(response => {
        res.response = response.json.data;
        res.meta = response.json.meta;
        next();
      })
      .catch(next);
  });

  return router;
};
