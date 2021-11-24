const { Router } = require('express');
const { get, remove, orderBy } = require('lodash');
const metrics = require('../middleware/metrics');

module.exports = settings => {
  const router = Router();

  router.use(metrics(settings));

  router.get('/', (req, res, next) => {
    const { DocumentCache } = settings.models;
    const { progress, limit, offset, filters, sort = {} } = req.query;

    const metricsParams = progress === 'open'
      ? { progress, withAsru: get(filters, 'withAsru[0]') }
      : { progress };

    const id = `asru-workload-${JSON.stringify(metricsParams)}}`;

    return DocumentCache.load(id, () => req.metrics('/asru-workload', { stream: false, query: metricsParams }))
      .then(data => {
        const role = get(filters, 'role[0]');

        if (role === 'inspector') {
          return data.filter(row => row.assignedTo.asruInspector);
        }
        if (role === 'licensing') {
          return data.filter(row => row.assignedTo.asruLicensing);
        }

        return data;
      })
      .then(data => {
        sort.column = sort.column || 'assignedTo.lastName';

        if (sort.column === 'assignedTo.lastName') {
          // keep 'unassigned' at the top regardless of sort order
          return [
            ...remove(data, row => row.assignedTo.id === 'unassigned'),
            ...orderBy(data, sort.column, sort.ascending === 'true' ? 'asc' : 'desc')
          ];
        }

        return orderBy(data, sort.column, sort.ascending === 'true' ? 'asc' : 'desc');
      })
      .then(data => data.slice(offset, offset + limit))
      .then(data => {
        // console.log(data);
        // res.meta.cache = data.cache;
        res.meta.total = data.length;
        res.meta.count = data.length;
        res.response = data;
      })

      .then(() => next())
      .catch(next);
  });

  return router;
};
