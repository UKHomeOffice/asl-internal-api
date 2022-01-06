const { Router } = require('express');
const { NotFoundError } = require('@asl/service/errors');

const pilReviews = require('./pil-reviews');
const pplList = require('./ppl-list');
const pplConditions = require('./ppl-conditions');
const namedPeople = require('./named-people');
const taskMetrics = require('./task-metrics');

module.exports = settings => {
  const router = Router({ mergeParams: true });

  router.get('/pil-reviews', pilReviews());

  router.get('/ppl-list', pplList());
  router.get('/ppl-conditions', pplConditions());

  router.get('/named-people', namedPeople());

  router.use('/task-metrics', taskMetrics(settings));

  router.get('/', () => {
    throw new NotFoundError();
  });

  return router;
};
