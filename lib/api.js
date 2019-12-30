const api = require('@asl/service/api');
const db = require('@asl/schema');

const proxy = require('./middleware/proxy');

const user = require('./middleware/user');
const profile = require('./routers/profile');
const searchRouter = require('./routers/search');
const asruEstablishment = require('./routers/asru-establishment');
const modelHistory = require('./routers/model-history');
const taskExtend = require('./routers/task-extend');
const projectVersion = require('./routers/project-version');
const establishment = require('./routers/establishment');

const errorHandler = require('@asl/service/lib/error-handler');

module.exports = settings => {

  const app = api(settings);
  const models = db(settings.db);

  app.use((req, res, next) => {
    req.models = models;
    next();
  });

  app.use(user());

  app.use('/metrics', proxy(`${settings.workflow}/metrics`));

  app.use('/asru', asruEstablishment());

  app.use('/profile', profile());

  app.use('/model-history', modelHistory());

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

  app.use((req, res, next) => {
    res.meta = {};
    next();
  });

  app.use('/establishment', establishment());

  app.use('/search', searchRouter());

  app.use('/tasks/:taskId/extend', taskExtend());

  app.use('/project-versions', projectVersion());

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
