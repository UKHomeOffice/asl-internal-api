const { Router } = require('express');
// const permissions = require('../middleware/permissions');
const whitelist = require('../middleware/whitelist');
// const { NotFoundError, UnauthorisedError } = require('@asl/service/errors');

// const notSelf = () => (req, res, next) => {
//   if (req.user.profile.id === req.profile.id) {
//     throw new UnauthorisedError();
//   }
//   next();
// };

const submit = action => {
  return (req, res, next) => {
    const params = {
      model: 'asruEstablishment',
      data: req.body.data,
      meta: req.body.meta
    };

    return Promise.resolve()
      .then(() => {
        switch (action) {
          case 'create':
            console.log('WORKFLOW CREATE WITH ', JSON.stringify(params));
            return req.workflow.create(params);
          case 'delete':
            return req.workflow.delete(params);
        }
      })
      .then(response => {
        res.response = response;
        next();
      })
      .catch(next);
  };
};

module.exports = () => {
  const router = Router();

  router.post(
    '/',
    // permissions('admin'),
    // whitelist('asruUser', 'asruAdmin'),
    // whitelist('asruAdmin'),
    // notSelf(),
    (req, res, next) => {
      next();
    },
    submit('create')
  );

  router.delete('/', whitelist('asruUser', 'asruAdmin'), submit('delete'));

  return router;
};
