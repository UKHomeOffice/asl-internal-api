const { Router } = require('express');
const { NotFoundError, UnauthorisedError, BadRequestError } = require('@asl/service/errors');

const { get } = require('lodash');

const hasRole = require('../middleware/has-role');
const whitelist = require('../middleware/whitelist');
const pil = require('./pil');

const notSelf = () => (req, res, next) => {
  if (req.user.profile.id === req.profile.id) {
    throw new UnauthorisedError();
  }
  next();
};

const update = (action = 'update') => (req, res, next) => {
  const params = {
    action,
    model: 'profile',
    id: req.profile.id,
    data: req.body.data,
    meta: req.body.meta
  };

  req.workflow.update(params)
    .then(response => {
      res.response = response;
      next();
    })
    .catch(next);
};

module.exports = () => {

  const router = Router();

  router.param('profileId', async (req, res, next, id) => {
    const { Profile, ProfileMergeLog, Project } = req.models;

    const profile = await Profile.query().findOne({ id })
      .withGraphFetched('[roles.places, establishments, pil, certificates, exemptions, asru(orderByName)]')
      .modifiers({
        orderByName: builder => {
          builder.orderBy('name');
        }
      });

    if (!profile) {
      return next(new NotFoundError());
    }

    req.profile = profile;

    if (req.profile.pil && !req.profile.pil.licenceNumber) {
      req.profile.pil.licenceNumber = req.profile.pilLicenceNumber;
    }

    const query = Project.query()
      .distinct('projects.*')
      .withGraphFetched('[additionalEstablishments(constrainAAParams), establishment(constrainEstParams)]')
      .modifiers({
        constrainAAParams: builder => builder.select('id', 'name', 'projectEstablishments.status'),
        constrainEstParams: builder => builder.select('id', 'name')
      })
      .where('projects.licenceHolderId', req.profile.id);

    req.profile.projects = await Project.filterUnsubmittedDrafts(query);

    const profileMerges = await ProfileMergeLog.query()
      .where('fromProfileId', profile.id)
      .orWhere('toProfileId', profile.id)
      .withGraphFetched('[toProfile, fromProfile]');

    req.profile.profileMerges = profileMerges.map(merge => {
      const mergedProfile = profile.id === merge.fromProfileId ? merge.toProfile : merge.fromProfile;
      return {
        id: merge.id,
        profile: { ...mergedProfile, name: `${mergedProfile.firstName} ${mergedProfile.lastName}` }
      };
    });

    next();
  });

  router.use('/:profileId/pil', pil());

  router.put('/:profileId',
    hasRole('admin'),
    whitelist('asruUser', 'asruAdmin', 'asruLicensing', 'asruInspector', 'asruSupport', 'asruRops'),
    notSelf(),
    update()
  );

  router.get('/:profileId', (req, res, next) => {
    res.response = req.profile;
    next();
  });

  router.post('/:profileId/merge',
    notSelf(),
    (req, res, next) => {
      const { Profile } = req.models;
      const id = get(req.body, 'data.target');
      return Profile.query().findOne({ id })
        .then(profile => {
          if (!profile) {
            throw new NotFoundError();
          }
          if (profile.asruUser) {
            throw new BadRequestError('Cannot merge profiles with an ASRU user');
          }
        })
        .then(() => req.workflow.profileTasks(req.profile.id))
        .then(response => {
          if (response.json.data.length) {
            throw new BadRequestError('Cannot merge profile with open tasks.');
          }
        })
        .then(() => req.workflow.profileTasks(id))
        .then(response => {
          if (response.json.data.length) {
            throw new BadRequestError('Cannot merge profile with open tasks.');
          }
        })
        .then(() => next())
        .catch(next);
    },
    update('merge')
  );

  return router;

};
