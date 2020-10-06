const { Router } = require('express');
const { ref } = require('objection');
const { NotFoundError } = require('@asl/service/errors');
const permissions = require('@asl/service/lib/middleware/permissions');
const { fees } = require('@asl/constants');

const getDefaultYear = () => {
  const lastYear = (new Date()).getFullYear() - 1;
  if (Object.keys(fees).includes(lastYear.toString())) {
    return lastYear;
  }
  return Object.keys(fees).pop();
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

const buildQuery = (models, start, end) => {
  const { Establishment, Profile } = models;
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

module.exports = () => {
  const app = Router({ mergeParams: true });

  app.use(permissions('licenceFees'));

  app.get('/waiver',
    permissions('pil.updateBillable'),
    (req, res, next) => {
      const { FeeWaiver } = req.models;
      const { establishmentId, profileId } = req.query;
      const year = parseInt(req.query.year, 10);
      return FeeWaiver
        .query()
        .findOne({ establishmentId, profileId, year })
        .eager('waivedBy')
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
    if (!fees[year]) {
      return next(new NotFoundError());
    }

    year = parseInt(year, 10);
    const start = `${year}-04-06`;
    const end = `${year + 1}-04-05`;
    req.fees = fees[year];
    res.meta.startDate = start;
    res.meta.endDate = end;
    res.meta.year = year;
    res.meta.years = Object.keys(fees);
    req.establishmentQuery = buildQuery(req.models, res.meta.startDate, res.meta.endDate);
    next();
  });

  app.get('/', (req, res, next) => {
    return req.establishmentQuery
      .then(result => {
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
    const { Establishment } = req.models;
    const { limit, offset, filter, sort = {} } = req.query;
    sort.column = sort.column || 'establishments.name';

    return Promise.resolve()
      .then(() => {
        let query = req.establishmentQuery;

        if (filter) {
          query = query.where(builder => {
            builder
              .where('establishments.name', 'ilike', `%${filter}%`);
          });
        }
        query = Establishment.orderBy({ query, sort });

        // add a secondary sort by establishment billable when sorting by number of pils
        // numberOfPils is used as a proxy property for the total bill
        // this avoids any weirdness when sorting non-billable and billable establishments with no PILs
        if (sort.column === 'numberOfPils') {
          query = Establishment.orderBy({
            query,
            sort: {
              ascending: sort.ascending === 'true' ? 'false' : 'true',
              column: 'isBillable'
            }
          });
        }
        query = Establishment.paginate({ query, limit, offset });
        return query;
      })
      .then(result => {
        res.meta.count = result.total;
        res.meta.total = result.total;
        res.response = result.results
          .map(est => {
            const numberOfPils = parseInt(est.numberOfPils, 10);
            return {
              ...est,
              numberOfPils,
              personal: numberOfPils * req.fees.pil,
              establishment: est.isBillable ? req.fees.pel : 0,
              total: numberOfPils * req.fees.pil + (est.isBillable ? req.fees.pel : 0)
            };
          });
      })
      .then(() => next())
      .catch(next);

  });

  return app;
};
