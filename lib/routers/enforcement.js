const { Router } = require('express');
const isUUID = require('uuid-validate');
const { get } = require('lodash');
const permissions = require('@asl/service/lib/middleware/permissions');
const { NotFoundError } = require('@asl/service/errors');
const whitelist = require('../middleware/whitelist');

const getEnforcementCases = req => {
  const { EnforcementCase } = req.models;
  const { limit, offset, search, sort = {} } = req.query;

  let query = EnforcementCase.query().withGraphFetched('flags.[establishment, profile, pil.profile, project.licenceHolder]');

  if (search) {
    query.where('caseNumber', search.trim());
  }

  query = EnforcementCase.orderBy({ query, sort });
  query = EnforcementCase.paginate({ query, limit, offset });

  const total = EnforcementCase.count();

  return Promise.all([query, total]);
};

const create = (req, res, next) => {
  const params = {
    model: 'enforcementCase',
    data: req.body.data,
    meta: req.body.meta
  };

  return req.workflow.create(params)
    .then(response => {
      console.log(response.json.data);
      const task = response.json.data;
      res.response = task;
      next();
    })
    .catch(next);
};

module.exports = () => {
  const router = Router();

  router.use(permissions('enforcement'));

  router.post('/',
    whitelist('caseNumber'),
    create
  );

  router.param('caseId', (req, res, next, caseId) => {
    if (!isUUID(caseId)) {
      return next(new NotFoundError());
    }

    const { EnforcementCase } = req.models;

    Promise.resolve()
      .then(() => {
        return EnforcementCase.query()
          .findById(caseId)
          .withGraphFetched('flags.[establishment, profile, pil, project]');
      })
      .then(enforcementCase => {
        if (!enforcementCase) {
          throw new NotFoundError();
        }
        req.enforcementCase = enforcementCase;
        next();
      })
      .catch(next);
  });

  router.get('/:caseId', async (req, res, next) => {
    const { Profile } = req.models;
    const enforcementCase = req.enforcementCase;

    try {
      for (const idx in enforcementCase.flags) {
        const flag = enforcementCase.flags[idx];
        const profileId = get(flag, 'profile.id') || get(flag, 'pil.profileId') || get(flag, 'project.licenceHolderId');
        flag.profile = profileId && await Profile.query().findById(profileId).withGraphFetched('[roles, pil, projects]');
      }
    } catch (err) {
      next(err);
    }

    res.response = enforcementCase;
    next();
  });

  router.get('/', (req, res, next) => {
    return Promise.resolve()
      .then(() => getEnforcementCases(req))
      .then(([enforcements, total]) => {
        res.meta.total = total;
        res.meta.count = enforcements.total;
        return enforcements.results;
      })
      .then(enforcementCases => {
        return enforcementCases.map(enforcement => {
          enforcement.flags.map(flag => {
            flag.profile = get(flag, 'profile') || get(flag, 'pil.profile') || get(flag, 'project.licenceHolder');
            return flag;
          });
          return enforcement;
        });
      })
      .then(enforcementCases => {
        res.response = enforcementCases;
      })
      .then(() => next())
      .catch(next);
  });

  return router;
};
