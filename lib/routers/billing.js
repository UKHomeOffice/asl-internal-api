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
        let activePils = Establishment
          .relatedQuery('pils')
          .where({ billable: true });

        activePils = activeBetween({ query: activePils, startDate, endDate });

        let transferredPils = Establishment
          .relatedQuery('transferredPils')
          .where('pilTransfers.createdAt', '>=', startDate)
          .where('pilTransfers.createdAt', '<=', endDate);

        let query = Establishment.query()
          .leftJoinRelation('pils')
          .distinct(
            'establishments.id',
            'establishments.name',
            'establishments.licenceNumber',
            activePils
              .count()
              .as('numberOfPils'),
            transferredPils
              .count()
              .as('numberOfTransferredPils')
          )
          .whereNotNull('establishments.issueDate');

        query = activeBetween({ query, startDate, endDate, table: 'establishments' });

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

  app.get('/transfers', (req, res, next) => {
    const { PilTransfer } = req.models;
    const { startDate, endDate } = req.query;

    Promise.resolve()
      .then(() => {
        return PilTransfer.query()
          .where('createdAt', '>=', startDate)
          .where('createdAt', '<=', endDate)
          .count();
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
      .then(() => {
        let query = PIL.query()
          .leftJoinRelation('profile')
          .leftJoinRelation('establishment')
          .whereNotNull('pils.issueDate')
          .eager('[profile, establishment]');

        // TODO: Include transferred licences.

        if (filters.onlyBillable === 'true') {
          query.whereNot({ billable: false });
        }

        query = activeBetween({ query, startDate: filters.startDate, endDate: filters.endDate, table: 'pils' });
        query = PIL.orderBy({ query, sort });
        query.orderBy('profile.lastName');

        query = PIL.paginate({ query, limit, offset });

        return query;
      })
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
