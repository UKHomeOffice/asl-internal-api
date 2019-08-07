const { Router } = require('express');

module.exports = () => {

  const router = Router({ mergeParams: true });

  const count = (Profile) => {
    return Profile.query().count().then(result => result[0].count);
  };

  const searchAndFilter = (Profile, {
    search,
    limit,
    offset,
    sort = {}
  }) => {
    let query = Profile.query();

    query
      .distinct('profiles.*')
      .leftJoinRelation('[pil, projects]')
      .eager('[pil, projects, establishments]')
      .where(builder => {
        if (search) {
          return builder
            .where('email', 'iLike', `%${search}%`)
            .orWhere('pil.licenceNumber', 'iLike', `%${search}%`)
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
    const { search, sort, limit, offset } = req.query;

    const params = {
      search,
      limit,
      offset,
      sort
    };

    return Promise.all([
      count(Profile),
      searchAndFilter(Profile, params)
    ]).then(([total, profiles]) => ({ total, profiles }));
  };

  router.get('/', (req, res, next) => {
    Promise.resolve()
      .then(() => getAllProfiles(req))
      .then(({ total, profiles }) => {
        res.meta.total = total;
        res.meta.count = profiles.total;
        res.response = profiles.results;
        next();
      })
      .catch(next);
  });

  return router;

};
