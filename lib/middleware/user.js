const { Router } = require('express');
const { UnauthorisedError } = require('@asl/service/errors');

module.exports = () => {

  const router = Router();

  router.use((req, res, next) => {
    const { Profile } = req.models;

    const getProfile = () => {
      return Profile.query().findOne({ userId: req.user.id });
    };

    const createProfile = () => {
      const params = {
        model: 'profile',
        data: {
          userId: req.user.id,
          firstName: req.user._auth.given_name,
          lastName: req.user._auth.family_name,
          email: req.user._auth.email
        }
      };

      return req.workflow.create(params);
    };

    Promise.resolve()
      .then(() => getProfile())
      .then(profile => {
        if (!profile) {
          return createProfile()
            .then(() => getProfile());
        }
        return profile;
      })
      .then(profile => {
        req.user.profile = profile;
        next();
      })
      .catch(next);
  });

  router.use((req, res, next) => {
    if (!req.user.profile.asruUser) {
      return next(new UnauthorisedError());
    }
    next();
  });

  return router;

};
