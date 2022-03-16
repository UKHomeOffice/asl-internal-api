const api = require('@asl/service/api');
const db = require('@asl/schema');

const proxy = require('./middleware/proxy');

const user = require('./middleware/user');
const profile = require('./routers/profile');
const billing = require('./routers/billing');
const asruProfiles = require('./routers/asru-profiles');
const asruWorkload = require('./routers/asru-workload');
const tasks = require('./routers/tasks');
const project = require('./routers/project');
const projectVersion = require('./routers/project-version');
const establishment = require('./routers/establishment');
const reports = require('./routers/reports');
const rops = require('./routers/rops');
const enforcement = require('./routers/enforcement');

const errorHandler = require('@asl/service/lib/error-handler');

module.exports = settings => {

  const app = api(settings);
  const models = db(settings.db);

  app.db = models;

  settings.models = models;

  app.use((req, res, next) => {
    req.models = models;
    next();
  });

  app.use(user());

  app.use((req, res, next) => {
    res.meta = {};
    next();
  });

  app.use('/search', proxy(settings.search));

  app.use('/reports', reports(settings));

  app.use('/asru/profiles', asruProfiles(settings));

  app.use('/asru/workload', asruWorkload(settings));

  app.use('/profile', profile(settings));

  app.use('/billing', billing(settings));

  app.use('/establishment', establishment(settings));

  app.use('/tasks', tasks(settings));

  app.use('/project', project(settings));

  app.use('/project-versions', projectVersion(settings));

  app.use('/rops', rops(settings));

  app.use('/enforcement', enforcement(settings));

  app.use((req, res, next) => {
    if (res.response) {
      const response = {
        data: res.response
      };
      response.meta = Object.assign({}, res.meta);

      return res.json(response);
    }
    next();
  });

  app.use(proxy(settings.api));

  app.use(errorHandler(settings));

  return app;

};
