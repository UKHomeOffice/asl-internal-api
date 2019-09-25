const { Router } = require('express');

module.exports = () => {

  const router = Router({ mergeParams: true });

  const count = Project => {
    return Project.filterUnsubmittedDrafts(Project.query().distinct('projects.id'))
      .then(results => results.length);
  };

  const searchAndFilter = (Project, {
    search,
    limit,
    offset,
    sort = {}
  }) => {
    let query = Project.query();

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
    const { search, sort, limit, offset } = req.query;

    const params = {
      search,
      limit,
      offset,
      sort
    };

    return Promise.all([
      count(Project),
      searchAndFilter(Project, params)
    ]).then(([total, projects]) => ({ total, projects }));
  };

  router.get('/', (req, res, next) => {
    Promise.resolve()
      .then(() => getAllProjects(req))
      .then(({ total, projects }) => {
        res.meta.total = total;
        res.meta.count = projects.total;
        res.response = projects.results;
        next();
      })
      .catch(next);
  });

  return router;

};
