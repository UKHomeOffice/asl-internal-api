const { Router } = require('express');
const { BadRequestError } = require('@asl/service/errors');

module.exports = () => {
  const router = Router({ mergeParams: true });

  router.put('/', async (req, res, next) => {
    const { taskId } = req.params;
    const { profileId } = req.body.data;
    const { Profile } = req.models;

    if (profileId) {
      const profile = await Profile.query().findById(profileId);
      if (!profile.asruUser) {
        return next(new BadRequestError('Only ASRU users can be assigned to tasks'));
      }
    }

    return req.workflow.task(taskId).assign({ profileId })
      .then(response => {
        res.response = response.json.data;
        next();
      })
      .catch(next);
  });

  return router;
};
