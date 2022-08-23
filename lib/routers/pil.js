const { Router } = require('express');
const permissions = require('@asl/service/lib/middleware/permissions');
const whitelist = require('../middleware/whitelist');

const update = action => (req, res, next) => {
  const params = {
    model: 'pil',
    id: req.pilId,
    data: {
      ...req.body.data,
      establishmentId: req.pil.establishmentId,
      profileId: req.profile.id
    },
    meta: req.body.meta,
    action
  };

  req.workflow.update(params)
    .then(response => {
      res.response = response.json.data;
      next();
    })
    .catch(next);
};

module.exports = () => {
  const app = Router({ mergeParams: true });

  app.param('pilId', (req, res, next, pilId) => {
    const { PIL } = req.models;
    return Promise.resolve()
      .then(() => PIL.query().findById(pilId))
      .then(pil => {
        req.pil = pil;
        req.pilId = pilId;
      })
      .then(() => next())
      .catch(next);
  });

  app.get('/', (req, res, next) => {
    const { PIL, TrainingPil } = req.models;
    Promise.all([
      PIL.query().where({ profileId: req.profile.id }).withGraphFetched('[pilTransfers.[from,to],establishment]').orderBy('issueDate', 'asc'),
      TrainingPil.query().where({ profileId: req.profile.id }).withGraphFetched('trainingCourse.[establishment,project]').orderBy('issueDate', 'asc')
    ]).then(([ pils, trainingPils ]) => {
      res.response = { pils, trainingPils };
      next();
    });
  });

  app.put('/:pilId/conditions',
    permissions('pil.updateConditions'),
    whitelist('conditions', 'reminder'),
    update('update-conditions')
  );

  app.put('/:pilId/suspend',
    permissions('pil.suspend'),
    update('suspend')
  );

  app.put('/:pilId/reinstate',
    permissions('pil.suspend'),
    update('reinstate')
  );

  return app;
};
