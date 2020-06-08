const moment = require('moment');
const { pick } = require('lodash');

module.exports = () => (req, res, next) => {
  const { knex } = req.models;

  return Promise.resolve()
    .then(() => {
      const results = [];
      return new Promise((resolve, reject) => {
        // use a knex query builder to access db streaming functionality
        // note: this means we don't have snake case mapper
        knex('projects')
          .select(
            'projects.*',
            'establishments.name',
            knex('project_versions')
              .select('project_versions.data')
              .where('project_versions.project_id', knex.raw('projects.id'))
              .where('project_versions.status', 'granted')
              .orderBy('project_versions.updated_at', 'desc')
              .first()
              .as('data')
          )
          .leftJoin('establishments', 'projects.establishment_id', 'establishments.id')
          .whereIn('projects.status', ['active', 'expired', 'revoked'])
          // stream results to avoid loading all data into memory
          .stream(stream => {
            stream.on('data', project => {
              results.push({
                establishment: project.name,
                ...pick(project, 'licence_number', 'title', 'status'),
                issue_date: moment(project.issue_date).format('YYYY-MM-DD'),
                conditions: project.data.conditions || [],
                protocols: (project.data.protocols || []).map(protocol => pick(protocol, ['title', 'conditions']))
              });
            });
            stream.on('end', () => resolve(results));
            stream.on('error', e => reject(e));
          });
      });
    })
    .then(projects => {
      res.response = projects;
    })
    .then(() => next())
    .catch(next);
};
