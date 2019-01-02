const api = require('@asl/service/api');
const db = require('@asl/schema');

const proxy = require('http-proxy-middleware');

module.exports = settings => {

  const app = api(settings);

  const models = db(settings.db);

  app.use((req, res, next) => {
    req.models = models;
    next();
  });

  app.use(proxy({ target: settings.api, secure: false }));

  return app;

};
