const { Router } = require('express');
const activeBetween = require('@asl/schema/lib/active-between');

const establishments = () => {
  const app = Router();

  app.get('/count', (req, res, next) => {
    const { Establishment } = req.models;
    const { startDate, endDate } = req.query;
    Promise.resolve()
      .then(() => {
        let query = Establishment.query();
        query = activeBetween({ query, startDate, endDate });
        return query.count();
      })
      .then(result => result[0])
      .then(({ count }) => {
        res.response = count;
      })
      .then(() => next())
      .catch(next);
  });

  app.get('/', (req, res, next) => {
    const { Establishment } = req.models;
    const { startDate, endDate, limit, offset, sort = {} } = req.query;

    Promise.resolve()
      .then(() => {
        let relatedQuery = Establishment
          .relatedQuery('pils')
          .where({ billable: true });

        relatedQuery = activeBetween({ query: relatedQuery, startDate, endDate });

        let query = Establishment.query()
          .select(
            'id',
            'name',
            'licenceNumber',
            relatedQuery
              .count()
              .as('numberOfPils')
          )
          .whereNotNull('issueDate');

        query = activeBetween({ query, startDate, endDate });

        if (sort.column) {
          query = Establishment.orderBy({ query, sort });
        }

        query = Establishment.paginate({ query, limit, offset });

        return query;
      })
      .then(establishments => {
        res.meta.count = establishments.total;
        res.response = establishments.results;
      })
      .then(() => next())
      .catch(next);
  });

  return app;
};

const pils = () => {
  const app = Router();

  app.get('/count', (req, res, next) => {
    const { PIL } = req.models;
    const { startDate, endDate, onlyBillable } = req.query;
    Promise.resolve()
      .then(() => {
        let query = PIL.query();
        if (onlyBillable) {
          query = query.where({ billable: true });
        }
        query = activeBetween({ query, startDate, endDate });
        return query.count();
      })
      .then(result => result[0])
      .then(({ count }) => {
        res.response = count;
      })
      .then(() => next())
      .catch(next);
  });

  app.get('/', (req, res, next) => {
    const { PIL } = req.models;
    const { startDate, endDate, limit, offset, sort } = req.query;
    const filters = {
      startDate,
      endDate,
      onlyBillable: true
    };
    Promise.resolve()
      .then(() => PIL.list({ filters, limit, offset, sort }))
      .then(pils => {
        res.meta.count = pils.total;
        res.response = pils.results;
      })
      .then(() => next())
      .catch(next);
  });

  return app;
};

module.exports = () => {
  const app = Router();

  app.use('/establishments', establishments());
  app.use('/pils', pils());

  return app;
};
