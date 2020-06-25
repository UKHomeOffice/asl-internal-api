const { Router } = require('express');

module.exports = () => {

  const router = Router({ mergeParams: true });

  const count = (Establishment) => {
    return Establishment.query().count().then(result => parseInt(result[0].count, 10));
  };

  const getFilterOptions = Establishment => Establishment.query()
    .distinct('status')
    .orderBy('status', 'asc')
    .then(status => status.map(r => r.status));

  const searchAndFilter = (Establishment, {
    search,
    limit,
    offset,
    sort = {},
    status = []
  }) => {
    let query = Establishment.query().eager('asru');
    status = status.filter(Boolean);

    if (search) {
      query.where(builder => {
        builder.where('name', 'iLike', `%${search}%`);
        builder.orWhere('licenceNumber', 'iLike', `%${search}%`);
      });
    }

    if (status.length) {
      query.whereIn('status', status);
    }

    query = Establishment.paginate({ query, limit, offset });

    if (sort.column) {
      query = Establishment.orderBy({ query, sort });
    } else {
      query.orderBy('name');
    }

    return query;
  };

  const getAllEstablishments = req => {
    const { Establishment } = req.models;
    const { search, sort, limit, offset, filters: { status } = {} } = req.query;

    const params = {
      search,
      limit,
      offset,
      sort,
      status
    };

    return Promise.all([
      getFilterOptions(Establishment),
      count(Establishment),
      searchAndFilter(Establishment, params)
    ]).then(([filters, total, establishments]) => ({ filters, total, establishments }));
  };

  router.get('/', (req, res, next) => {
    Promise.resolve()
      .then(() => getAllEstablishments(req))
      .then(({ filters, total, establishments }) => {
        res.meta.filters = filters;
        res.meta.total = total;
        res.meta.count = establishments.total;
        res.response = establishments.results;
        next();
      })
      .catch(next);
  });

  return router;

};
