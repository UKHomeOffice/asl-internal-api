const { Router } = require('express');
const isUUID = require('uuid-validate');
const { NotFoundError, BadRequestError } = require('@asl/service/errors');
const permissions = require('@asl/service/lib/middleware/permissions');
const whitelist = require('../middleware/whitelist');

const update = (action) => (req, res, next) => {
  const params = {
    model: 'project',
    meta: req.body.meta,
    data: {
      establishmentId: req.project.establishmentId,
      ...req.body.data
    },
    action,
    id: req.project.id
  };

  return req.workflow.update(params)
    .then(response => {
      res.response = response;
      next();
    })
    .catch(next);
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

  router.put('/:projectId/issue-date',
    permissions('project.updateIssueDate'),
    whitelist('issueDate'),
    isActiveProject,
    update('update-issue-date')
  );

  return router;
};
