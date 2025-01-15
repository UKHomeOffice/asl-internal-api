const { Router } = require('express');
const { ref } = require('objection');
const { orderBy } = require('lodash');
const { NotFoundError } = require('@asl/service/errors');
const permissions = require('@asl/service/lib/middleware/permissions');
const { fees } = require('@ukhomeoffice/asl-constants');
const moment = require('moment');

const pastAndCurrentFees = () => {
  const financialYearStart = moment(`04-06 00:00:00`, 'MM-DD HH:mm:ss');

  let currentFinancialYear = (new Date()).getFullYear();
  if (financialYearStart.isAfter()) {
    currentFinancialYear--;
  }

  return Object.fromEntries(
    Object.entries(fees).filter(([k]) => k <= currentFinancialYear)
  );
};

const getDefaultYear = () => {
  const lastYear = (new Date()).getFullYear() - 1;
  let feesToShow = pastAndCurrentFees(fees);
  if (Object.keys(feesToShow).includes(lastYear.toString())) {
    return lastYear;
  }
  return Object.keys(feesToShow).pop();
};

const update = () => (req, res, next) => {
  const params = {
    model: 'feeWaiver',
    id: req.body.profileId,
    data: {
      ...req.body
    },
    action: req.body.waived ? 'create' : 'delete'
  };
  req.workflow.update(params)
    .then(response => {
      res.response = response;
      next();
    })
    .catch(next);
};

module.exports = settings => {

  const { Establishment, Profile, DocumentCache, FeeWaiver } = settings.models;

  const buildQuery = (year) => {

    const start = `${year}-04-06`;
    const end = `${year + 1}-04-05`;

    return Establishment.query()
      .select(
        'establishments.*',
        Profile.query()
          .whereHasBillablePIL({
            establishmentId: ref('establishments.id'),
            start,
            end
          })
          .whereNotWaived()
          .count()
          .as('numberOfPils'),
        Establishment.query()
          .alias('e')
          .where('e.id', ref('establishments.id'))
          .where('e.issueDate', '<', end)
          .where(builder => {
            builder
              .whereNull('e.revocationDate')
              .orWhere('e.revocationDate', '>', start);
          })
          .select(1)
          .as('isBillable')
      );
  };

  // warm the cache by loading fees data for each year in config into the cache table
  Object.keys(fees).forEach(year => {
    const id = `billing-${year}`;
    DocumentCache.load(id, () => buildQuery(year)).catch(() => { /* do nothing */ });
  });

  const app = Router({ mergeParams: true });

  app.use(permissions('licenceFees'));

  app.get('/waiver',
    permissions('pil.updateBillable'),
    (req, res, next) => {
      const { establishmentId, profileId } = req.query;
      const year = parseInt(req.query.year, 10);
      return FeeWaiver
        .query()
        .findOne({ establishmentId, profileId, year })
        .withGraphFetched('waivedBy')
        .then(result => {
          res.response = result;
          next('router');
        })
        .catch(next);
    }
  );

  app.post('/waiver',
    permissions('pil.updateBillable'),
    update(),
    (req, res, next) => next('router')
  );

  app.use((req, res, next) => {
    let year = req.query.year;
    if (!year) {
      year = getDefaultYear();
      res.meta.year = year;
      res.response = {};
      return next('router');
    }

    const feesToShow = pastAndCurrentFees(fees);

    if (!feesToShow[year]) {
      return next(new NotFoundError());
    }

    year = parseInt(year, 10);
    const start = `${year}-04-06`;
    const end = `${year + 1}-04-05`;
    req.fees = feesToShow[year];
    res.meta.startDate = start;
    res.meta.endDate = end;
    req.year = year;
    res.meta.year = year;
    res.meta.years = Object.keys(feesToShow);
    next();
  });

  app.get('/', (req, res, next) => {
    const id = `billing-${req.year}`;
    return DocumentCache.load(id, () => buildQuery(req.year))
      .then((result) => {
        const numberOfPels = result.filter(est => est.isBillable).length;
        const numberOfPils = result.reduce((sum, est) => sum + parseInt(est.numberOfPils, 10), 0);

        res.response = {};
        res.response.numberOfPels = numberOfPels;
        res.response.numberOfPils = numberOfPils;
        res.response.fees = req.fees;
        res.response.personal = numberOfPils * req.fees.pil;
        res.response.establishment = numberOfPels * req.fees.pel;
        res.response.total = res.response.personal + res.response.establishment;
      })
      .then(() => next())
      .catch(next);
  });

  app.get('/establishments', (req, res, next) => {
    const { limit, offset, filter, sort = {} } = req.query;
    sort.column = sort.column || 'establishments.name';

    return Promise.resolve()
      .then(() => {
        const id = `billing-${req.year}`;
        return DocumentCache.load(id, () => buildQuery(req.year));
      })
      .then(result => {
        res.meta.cache = result.cache;
        res.meta.total = result.length;
        if (filter) {
          return result.filter(establishment => establishment.name.toLowerCase().includes(filter.toLowerCase()));
        }
        return result;
      })
      .then((result) => {
        res.meta.count = result.length;
        return result.map(est => {
          return {
            ...est,
            personal: est.numberOfPils * req.fees.pil,
            establishment: est.isBillable ? req.fees.pel : 0,
            total: est.numberOfPils * req.fees.pil + (est.isBillable ? req.fees.pel : 0)
          };
        });
      })
      .then(result => {
        return orderBy(result, sort.column, sort.ascending === 'true' ? 'asc' : 'desc');
      })
      .then(result => result.slice(offset, offset + limit))
      .then(result => {
        res.response = result;
      })
      .then(() => next())
      .catch(next);

  });

  return app;
};
