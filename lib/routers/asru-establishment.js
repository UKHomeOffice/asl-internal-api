const { Router } = require('express');

const submit = action => {
  return (req, res, next) => {
    // Assign an id of 1 so we can bypass asl-service workflow client validation
    const params = {
      id: '1',
      model: 'asruEstablishment',
      data: req.body.data,
      meta: req.body.meta
    };

    return Promise.resolve()
      .then(() => {
        switch (action) {
          case 'create':
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

  router.get('/', (req, res, next) => {
    return req.models.AsruEstablishment.query()
      .eager('profile')
      .then(profiles => {
        res.response = profiles;
      })
      .then(() => next())
      .catch(next);
  });

  router.post('/', submit('create')
  );

  router.delete('/', submit('delete')
  );

  return router;
};
