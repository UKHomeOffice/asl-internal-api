const { Router } = require('express');
const { get, remove, orderBy, omitBy, isEmpty } = require('lodash');
const metrics = require('../middleware/metrics');

module.exports = settings => {
  const router = Router();

  router.use(metrics(settings));

  router.get('/', (req, res, next) => {
    const { DocumentCache } = settings.models;
    const { progress, start, end, limit, offset, filters, sort = {} } = req.query;

    let metricsParams = progress === 'open'
      ? { progress, withAsru: get(filters, 'withAsru[0]') }
      : { progress, start, end };

    metricsParams = omitBy(metricsParams, isEmpty);

    const id = `asru-workload-${new URLSearchParams(metricsParams).toString()}`;

    return DocumentCache.load(id, () => req.metrics('/asru-workload', { stream: false, query: metricsParams }))
      .then(data => {
        res.meta.cache = data.cache;
        res.meta.total = data.length;

        if (progress === 'closed') {
          // don't return unassigned counts
          data = data.filter(row => row.assignedTo.id !== 'unassigned');
        }

        const role = get(filters, 'role[0]');

        if (role === 'inspector') {
          data = data.filter(row => row.assignedTo.asruInspector);
        }
        if (role === 'licensing') {
          data = data.filter(row => row.assignedTo.asruLicensing);
        }

        return data;
      })
      .then(data => {
        if (!sort.column) {
          sort.column = 'assignedTo.lastName';
          sort.ascending = 'true';
        }

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
        res.meta.count = data.length;
        res.response = data;
      })

      .then(() => next())
      .catch(next);
  });

  return router;
};
