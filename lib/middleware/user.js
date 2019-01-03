const { Router } = require('express');

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
    const err = new Error('Unauthorised');
    err.status = 403;
    return next(err);
  }
  next();
});

module.exports = router;
