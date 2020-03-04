const { Router } = require('express');
const isUUID = require('uuid-validate');
const { NotFoundError, BadRequestError } = require('@asl/service/errors');
const permissions = require('@asl/service/lib/middleware/permissions');
const whitelist = require('../middleware/whitelist');

const submit = action => (req, res, next) => {
  const params = {
    model: 'project',
    meta: {
      ...req.body.meta,
      changedBy: req.user.profile.id
    },
    data: {
      ...req.body.data
    }
  };

  return Promise.resolve()
    .then(() => {
      switch (action) {
        case 'create':
          return req.workflow.create(params);

        case 'convert':
        case 'update-issue-date':
          return req.workflow.update({
            ...params,
            id: req.project.id,
            data: {
              ...params.data,
              establishmentId: req.project.establishmentId
            },
            action
          });

        case 'delete':
          return req.workflow.delete({
            ...params,
            id: req.project.id
          });
      }
    })
    .then(response => {
      res.response = response.json.data;
      next();
    })
    .catch(next);
};

const isLegacyStub = (req, res, next) => {
  if (!req.project.isLegacyStub) {
    return next(new BadRequestError('only project stubs can be deleted via this route'));
  }
  next();
};

const isActiveProject = (req, res, next) => {
  if (req.project.status !== 'active') {
    return next(new BadRequestError('only active projects can have their issue date changed'));
  }
  next();
};

module.exports = () => {
  const router = Router();

  router.param('projectId', (req, res, next, projectId) => {
    if (!isUUID(projectId)) {
      return next(new NotFoundError());
    }

    const { Project } = req.models;

    Promise.resolve()
      .then(() => {
        return Project.query().findById(projectId);
      })
      .then(project => {
        if (!project) {
          throw new NotFoundError();
        }
        req.project = project;
        next();
      })
      .catch(next);
  });

  router.post('/create-stub',
    permissions('project.convertLegacy'),
    whitelist('establishmentId', 'licenceHolderId', 'title', 'licenceNumber', 'issueDate', 'isLegacyStub', 'version'),
    submit('create')
  );

  router.put('/:projectId/convert-stub',
    permissions('project.convertLegacy'),
    submit('convert')
  );

  router.delete('/:projectId',
    permissions('project.convertLegacy'),
    isLegacyStub,
    submit('delete')
  );

  router.put('/:projectId/issue-date',
    permissions('project.updateIssueDate'),
    whitelist('issueDate'),
    isActiveProject,
    submit('update-issue-date')
  );

  return router;
};
