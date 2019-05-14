const { Router } = require('express');
const hasRole = require('../middleware/has-role');

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

  router.use('/inspectors', (req, res, next) => {
    const { Profile } = req.models;
    return Profile.query()
      .where('asruUser', true)
      .andWhere('asruInspector', true)
      .orderBy(['lastName', 'firstName'])
      .then(data => {
        res.response = data;
        next();
      });
  });

  router.use('/spocs', (req, res, next) => {
    const { Profile } = req.models;
    return Profile.query()
      .where('asruUser', true)
      .andWhere('asruLicensing', true)
      .orderBy(['lastName', 'firstName'])
      .then(data => {
        res.response = data;
        next();
      });
  });

  router.post('/', hasRole('admin'), submit('create'));

  router.delete('/', hasRole('admin'), submit('delete'));

  return router;
};
