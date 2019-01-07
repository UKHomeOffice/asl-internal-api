const { Router } = require('express');
const searchEstablishments = require('./establishment');
const searchProfiles = require('./profile');
const searchProjects = require('./project');

module.exports = () => {
  const router = Router();

  router.use('/establishments', searchEstablishments());
  router.use('/profiles', searchProfiles());
  router.use('/projects', searchProjects());

  return router;
};
