const { Router } = require('express');

module.exports = () => {

  const router = Router({ mergeParams: true });

  const count = (Establishment) => {
    return Establishment.query().count().then(result => result[0].count);
  };

  const searchAndFilter = (Establishment, {
    search,
    limit,
    offset,
    sort = {}
  }) => {
    let query = Establishment.query();

    query
      .distinct('establishments.*')
      .where(builder => {
        if (search) {
          return builder.where('name', 'iLike', `%${search}%`);
        }
      });

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
    const { search, sort, limit, offset } = req.query;

    const params = {
      search,
      limit,
      offset,
      sort
    };

    return Promise.all([
      count(Establishment),
      searchAndFilter(Establishment, params)
    ]).then(([total, establishments]) => ({ total, establishments }));
  };

  router.get('/', (req, res, next) => {
    Promise.resolve()
      .then(() => getAllEstablishments(req))
      .then(({ total, establishments }) => {
        res.meta.total = total;
        res.meta.count = establishments.total;
        res.response = establishments.results;
        next();
      })
      .catch(next);
  });

  return router;

};
