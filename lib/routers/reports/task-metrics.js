const { Router } = require('express');
const moment = require('moment');
const { BadRequestError } = require('@asl/service/errors');
const metrics = require('../../middleware/metrics');

module.exports = settings => {
  const router = Router({ mergeParams: true });

  router.use(metrics(settings));

  router.get('/', (req, res, next) => {
    const { year, month } = req.query;

    if (!year) {
      throw new BadRequestError('valid year must be provided');
    }

    if (!month) {
      throw new BadRequestError('valid month must be provided');
    }

    const start = moment(`${year}-${month}-01`);

    if (!start.isValid() || start.isBefore('2021-12-01')) {
      throw new BadRequestError('reports prior to internal deadlines (Dec 2021) are invalid');
    }

    const end = start.clone().endOf('month');

    const metricsParams = {
      start: start.format('YYYY-MM-DD'),
      end: end.format('YYYY-MM-DD')
    };

    return req.metrics('/reports/internal-deadlines', { stream: false, query: metricsParams })
      .then(data => {
        res.response = data.filter(Boolean);
      })
      .then(() => next())
      .catch(next);
  });

  return router;
};
