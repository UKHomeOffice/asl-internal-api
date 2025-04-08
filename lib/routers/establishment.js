const { Router } = require('express');
const whitelist = require('../middleware/whitelist');
const permissions = require('@asl/service/lib/middleware/permissions');
const { BadRequestError, NotFoundError } = require('@asl/service/errors');

const update = action => (req, res, next) => {
  const params = {
    model: 'establishment',
    id: req.establishment.id,
    data: req.body.data,
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

const updatePIL = action => (req, res, next) => {
  const params = {
    data: {
      establishmentId: req.body.establishmentId,
      profileId: req.body.profileId
    },
    model: 'pil'
  };

  return Promise.resolve()
    .then(() => {
      switch (action) {
        case 'remove':
          return req.workflow.delete({
            ...params,
            id: req.body.pilId
          });
        default:
          return req.workflow.update({
            ...params,
            action: action,
            id: req.body.pilId
          });
      }
    })
    .then(response => {
      res.response = response.json.data;
      next();
    })
    .catch(next);
};

const create = (req, res, next) => {
  const params = {
    model: 'establishment',
    data: req.body.data,
    meta: req.body.meta
  };

  return req.workflow.create(params)
    .then(response => {
      const task = response.json.data;
      res.response = task.data.establishment;
      next();
    })
    .catch(next);
};

const canRevoke = (req, res, next) => {
  if (req.establishment.status !== 'active') {
    return next(new BadRequestError('cannot revoke establishment because it is not active'));
  }

  if (req.establishment.activePilsCount > 0) {
    return next(new BadRequestError('cannot revoke establishment because it has active pils'));
  }

  if (req.establishment.activeProjectsCount > 0) {
    return next(new BadRequestError('cannot revoke establishment because it has active projects'));
  }
  return next();
};

module.exports = () => {
  const router = Router();

  router.post('/',
    permissions('establishment.create'),
    whitelist('name', 'corporateStatus'),
    create
  );

  router.param('id', (req, res, next, id) => {
    const { Establishment, PIL, Project } = req.models;

    return Promise.resolve()
      .then(() => {
        const query = Establishment.query()
          .findById(id)
          .select('establishments.*');

        const activePilsQuery = PIL.query()
          .count('pils.id')
          .where('status', 'active')
          .andWhere('establishmentId', id)
          .as('activePilsCount');

        const activeProjectsQuery = Project.query()
          .count('projects.id')
          .where('status', 'active')
          .andWhere('establishmentId', id)
          .as('activeProjectsCount');

        return query.select(activePilsQuery, activeProjectsQuery);
      })
      .then(result => {
        if (!result) {
          throw new NotFoundError();
        }
        req.establishment = result;
        next();
      })
      .catch(next);
  });

  router.put('/:id/suspend',
    permissions('establishment.suspend'),
    update('suspend')
  );

  router.put('/:id/reinstate',
    permissions('establishment.suspend'),
    update('reinstate')
  );

  router.put('/:id/revoke',
    permissions('establishment.revoke'),
    whitelist('comments'),
    canRevoke,
    update('revoke')
  );

  router.put('/:id/conditions',
    permissions('establishment.updateConditions'),
    whitelist('conditions', 'reminder'),
    update('update-conditions')
  );

  router.put('/:id',
    permissions('establishment.update'),
    update('update')
  );

  router.put('/:id/removepil',
    permissions('asruReporting'),
    updatePIL('remove')
  );

  router.put('/:id/revokepil',
    permissions('asruReporting'),
    updatePIL('revoke')
  );

  return router;
};
