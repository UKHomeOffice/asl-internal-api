const { Router } = require('express');
const { NotFoundError } = require('@asl/service/errors');

const pilReviews = require('./pil-reviews');
const pplList = require('./ppl-list');

module.exports = () => {
  const router = Router({ mergeParams: true });

  router.get('/pil-reviews', pilReviews());

  router.get('/ppl-list', pplList());

  router.get('/', () => {
    throw new NotFoundError();
  });

  return router;
};
