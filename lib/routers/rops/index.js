const { Router } = require('express');
const { NotFoundError } = require('@asl/service/errors');
const permissions = require('@asl/service/lib/middleware/permissions');
const whitelist = require('../../middleware/whitelist');

const submit = () => (req, res, next) => {
  const params = {
    model: 'export',
    meta: {
      changedBy: req.user.profile.id
    },
    data: {
      type: 'rops',
      key: req.year,
      profileId: req.user.profile.id
    }
  };

  return req.workflow.create(params)
    .then(response => {
      res.response = response.json.data;
      next();
    })
    .catch(next);
};

module.exports = () => {
  const router = Router();

  router.use(permissions('asruRops'));

  router.param('year', (req, res, next, year) => {
    if (!year.match(/^20[0-9]{2}/)) {
      throw new NotFoundError();
    }
    req.year = year;
    next();
  });

  router.get('/:year/summary', (req, res, next) => {
    const { Project } = req.models;
    const year = req.year;

    let due = 0;
    let submitted = 0;
    let outstanding = 0;
    let overdue = 0;

    return Project.query()
      .select('id')
      .whereRopsDue(year)
      .withRops(year, 'submitted')
      .then(projects => {
        due = projects.length;
        submitted = projects.filter(p => p.ropsSubmittedDate).length;
        outstanding = due - submitted;
        const now = (new Date()).toISOString();

        projects.forEach(p => {
          if (!p.ropsSubmittedDate && p.ropsDeadline < now) {
            overdue++;
          }
        });

        res.response = { year, due, submitted, outstanding, overdue };
      })
      .then(() => next())
      .catch(next);
  });

  router.get('/:year/establishments', (req, res, next) => {
    const { Establishment } = req.models;
    const { limit, offset, sort } = req.query;
    const year = req.year;

    const ropsQuery = Establishment.relatedQuery('projects').count('id').whereRopsDue(year);

    let query = Establishment.query()
      .select('id', 'name')
      .select(ropsQuery.clone().as('ropsDue'))
      .select(ropsQuery.clone().whereRopsSubmitted(year).as('ropsSubmitted'))
      .select(ropsQuery.clone().whereRopsOutstanding(year).as('ropsOutstanding'))
      .where('establishments.status', 'active');

    query = Establishment.orderBy({ query, sort });
    query = Establishment.paginate({ query, limit, offset });

    const total = Establishment.query()
      .where({ status: 'active' })
      .count()
      .then(result => result[0].count);

    return Promise.all([ total, query ])
      .then(([total, establishments]) => {
        res.meta.total = total;
        res.meta.count = establishments.total;
        res.response = establishments.results;
        return next();
      })
      .catch(next);
  });

  router.use('/:year/export', (req, res, next) => {
    const { Export } = req.models;
    return Export.query()
      .withGraphFetched('profile')
      .where({ key: req.year })
      .orderBy('createdAt', 'desc')
      .then(result => {
        req.exports = result;
      })
      .then(() => next())
      .catch(next);
  });

  router.get('/:year/export/:exportId', (req, res, next) => {
    const { Export } = req.models;
    return Export.query()
      .findById(req.params.exportId)
      .then(result => {
        res.response = result;
      })
      .then(() => next())
      .catch(next);
  });

  router.get('/:year/export', (req, res, next) => {
    res.response = req.exports;
    next();
  });

  router.post('/:year/export',
    (req, res, next) => {
      // if there is already a pending request then don't create another
      if (req.exports.find(row => !row.ready)) {
        res.response = {};
        return next('router');
      }
      next();
    },
    whitelist(),
    submit()
  );

  return router;
};
