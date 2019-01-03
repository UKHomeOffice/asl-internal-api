const { Router } = require('express');

const router = Router({ mergeParams: true });

const getFilterOptions = (Profile, { query }) => {
  query = query || Profile.query();
  return query;
};

const count = (Profile, { query }) => {
  query = query || Profile.query();
  return query.count().then(result => result[0].count);
};

const searchAndFilter = (Profile, {
  query,
  search,
  filters = {},
  limit,
  offset,
  sort = {}
}) => {
  query = query || Profile.query();

  query
    .distinct('profiles.*')
    .leftJoinRelation('[pil, projects]')
    .eager('[pil, projects, establishments]')
    .where(builder => {
      if (search) {
        return builder
          .orWhere(builder => Profile.searchFullName({ search, query: builder }));
      }
    });

  query = Profile.paginate({ query, limit, offset });

  if (sort.column) {
    query = Profile.orderBy({ query, sort });
  } else {
    query.orderBy('lastName');
  }

  return query;
};

const getAllProfiles = req => {
  const { Profile } = req.models;
  const { search, sort, filters, limit, offset } = req.query;

  const params = {
    search,
    limit,
    offset,
    sort,
    filters
  };

  console.log(params);

  return Promise.all([
    getFilterOptions(Profile, params),
    count(Profile, params),
    searchAndFilter(Profile, params)
  ]).then(([filters, total, profiles]) => ({ filters, total, profiles }));
};

router.get('/', (req, res, next) => {
  Promise.resolve()
    .then(() => getAllProfiles(req))
    .then(({ filters, total, profiles }) => {
      res.meta.filters = filters;
      res.meta.total = total;
      res.meta.count = profiles.total;
      res.response = profiles.results;
      next();
    })
    .catch(next);
});

module.exports = router;
