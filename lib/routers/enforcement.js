const { Router } = require('express');
const isUUID = require('uuid-validate');
const { get } = require('lodash');
const permissions = require('@asl/service/lib/middleware/permissions');
const { NotFoundError, BadRequestError } = require('@asl/service/errors');
const whitelist = require('../middleware/whitelist');

const getEnforcementCases = req => {
  const { EnforcementCase } = req.models;
  const { limit, offset, search, sort = { column: 'createdAt', order: 'descending' } } = req.query;

  let query = EnforcementCase.query()
    .withGraphFetched(
      'subjects.[establishment, profile, flags.[establishment, profile.establishments, pil.establishment, project.establishment]]'
    );

  if (search) {
    query.where('caseNumber', search.trim());
  }

  query = EnforcementCase.orderBy({ query, sort });
  query = EnforcementCase.paginate({ query, limit, offset });

  const total = EnforcementCase.count();

  return Promise.all([query, total]);
};

const createCase = (req, res, next) => {
  const params = {
    model: 'enforcementCase',
    data: req.body.data,
    meta: req.body.meta
  };

  return req.workflow.create(params)
    .then(response => {
      res.response = response.json.data;
      next();
    })
    .catch(next);
};

const updateSubject = (req, res, next) => {
  const { EnforcementSubject } = req.models;
  const subject = get(req, 'body.data.subject');

  const params = {
    model: 'enforcementCase',
    id: req.enforcementCase.id,
    data: req.body.data,
    meta: req.body.meta,
    action: 'update-subject'
  };

  return req.workflow.update(params)
    .then(() => {
      return Promise.resolve()
        .then(() => {
          return EnforcementSubject.query()
            .findById(subject.id)
            .withGraphFetched('[establishment, profile.[roles.establishment, pil, projects(notDraft)], flags.[establishment, profile, pil, project]]')
            .modifiers({
              notDraft: builder => builder.where('projects.status', '!=', 'inactive')
            });
        })
        .then(updatedSubject => {
          res.response = updatedSubject || { id: subject.id, deleted: true };
        })
        .then(() => next());
    })
    .catch(next);
};

module.exports = () => {
  const router = Router();

  router.use(permissions('enforcement'));

  router.post('/',
    whitelist('caseNumber'),
    createCase
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
          .withGraphFetched('subjects.[establishment, profile.[roles.establishment, pil, projects(notDraft)], flags.[establishment, profile, pil, project]]')
          .modifiers({
            notDraft: builder => builder.where('projects.status', '!=', 'inactive')
          });
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
    res.response = req.enforcementCase;
    next();
  });

  router.param('subjectId', (req, res, next, subjectId) => {
    req.subjectId = subjectId;
    next();
  });

  router.put('/:caseId/subject/:subjectId',
    whitelist('subject'),
    updateSubject
  );

  router.get('/', (req, res, next) => {
    return Promise.resolve()
      .then(() => getEnforcementCases(req))
      .then(([enforcements, total]) => {
        res.meta.total = total;
        res.meta.count = enforcements.total;
        return enforcements.results;
      })
      .then(enforcementCases => {
        res.response = enforcementCases;
      })
      .then(() => next())
      .catch(next);
  });

  router.get('/flags/:modelId', (req, res, next) => {
    const { EnforcementFlag } = req.models;
    const modelId = req.params.modelId;

    if (!modelId) {
      return next(new BadRequestError('modelId is required'));
    }

    const query = EnforcementFlag.query()
      .where(builder => {
        if (!isUUID(modelId)) {
          builder.where({ modelType: 'establishment', establishmentId: parseInt(modelId, 10) });
        } else {
          builder.where({ modelId });
        }
      })
      .withGraphFetched('subject.enforcementCase');

    return query
      .then(flags => {
        res.response = flags;
      })
      .then(() => next())
      .catch(next);
  });

  return router;
};
