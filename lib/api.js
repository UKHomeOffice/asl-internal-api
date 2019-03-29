const api = require('@asl/service/api');
const db = require('@asl/schema');

const proxy = require('./middleware/proxy');

const user = require('./middleware/user');
const profile = require('./routers/profile');
const searchRouter = require('./routers/search');
const profileToEstablishment = require('./routers/profile-to-establishment');

module.exports = settings => {

  const app = api(settings);
  const models = db(settings.db);

  app.use((req, res, next) => {
    req.models = models;
    next();
  });

  app.use(user());

  app.use('/profile', profile());

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

  app.use('/search', searchRouter());

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

  app.use('/assign', profileToEstablishment());

  return app;

};
