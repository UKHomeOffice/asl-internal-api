const { Router } = require('express');

module.exports = () => {

  const router = Router({ mergeParams: true });

  const count = (Project) => {
    return Project.query().where({ status: 'active' }).count().then(result => result[0].count);
  };

  const searchAndFilter = (Project, {
    search,
    limit,
    offset,
    sort = {}
  }) => {
    let query = Project.query();

    query
      .distinct('projects.*', 'licenceHolder.lastName')
      .leftJoinRelation('licenceHolder')
      .eager('[licenceHolder, establishment]')
      .where({ status: 'active' })
      .where(builder => {
        if (search) {
          return builder
            .where('projects.title', 'iLike', `%${search}%`)
            .orWhere('projects.licenceNumber', 'iLike', `%${search}%`);
        }
      });

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
