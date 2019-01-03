const proxy = require('http-proxy-middleware');
const api = require('@asl/service/api');
const db = require('@asl/schema');

const user = require('./middleware/user');
const profile = require('./routers/profile');
const searchProfiles = require('./routers/search/profile');

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

  app.use('/search/profiles', searchProfiles());
  // app.use('/search/establishments', require('./routers/search/establishment'));
  // app.use('/search/projects', require('./routers/search/project'));

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

  app.use(proxy({ target: settings.api, secure: false }));

  return app;

};
