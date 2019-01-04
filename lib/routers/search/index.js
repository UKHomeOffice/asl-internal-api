const { Router } = require('express');
const searchEstablishments = require('./establishment');
const searchProfiles = require('./profile');

module.exports = () => {
  const router = Router();

  router.use('/establishments', searchEstablishments());
  router.use('/profiles', searchProfiles());

  return router;
};
