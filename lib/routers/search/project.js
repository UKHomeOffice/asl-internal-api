const { Router } = require('express');

module.exports = () => {

  const router = Router({ mergeParams: true });

  const count = Project => {
    return Project.filterUnsubmittedDrafts(Project.query().distinct('projects.id'))
      .then(results => results.length);
  };

  const getFilterOptions = Project => Project.query()
    .distinct('status')
    .orderBy('status', 'asc')
    .then(statuses => statuses.map(s => s.status));

  const searchAndFilter = (Project, {
    search,
    limit,
    offset,
    sort = {},
    status = []
  }) => {
    let query = Project.query();
    status = status.filter(Boolean);

    query
      .distinct('projects.*', 'licenceHolder.lastName', 'establishment.name')
      .leftJoinRelation('licenceHolder')
      .joinRelation('establishment')
      .eager('[licenceHolder, establishment]')
      .where(builder => {
        if (search) {
          return builder
            .where('projects.title', 'iLike', `%${search}%`)
            .orWhere('projects.licenceNumber', 'iLike', `%${search}%`);
        }
      });

    if (status.length) {
      query.whereIn('projects.status', status);
    }

    query = Project.filterUnsubmittedDrafts(query);

    query = Project.paginate({ query, limit, offset });

    if (sort.column) {
      query = Project.orderBy({ query, sort });
    } else {
      query.orderBy('projects.title');
    }

    return query;
  };

  const getAllProjects = req => {
    const { Project } = req.models;
    const { search, sort, limit, offset, filters: { status } = {} } = req.query;

    const params = {
      search,
      limit,
      offset,
      sort,
      status
    };

    return Promise.all([
      getFilterOptions(Project),
      count(Project),
      searchAndFilter(Project, params)
    ]).then(([filters, total, projects]) => ({ filters, total, projects }));
  };

  router.get('/', (req, res, next) => {
    Promise.resolve()
      .then(() => getAllProjects(req))
      .then(({ filters, total, projects }) => {
        res.meta.filters = filters;
        res.meta.total = total;
        res.meta.count = projects.total;
        res.response = projects.results;
        next();
      })
      .catch(next);
  });

  return router;

};
