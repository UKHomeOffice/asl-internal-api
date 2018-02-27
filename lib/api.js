const api = require('@asl/service/api');
const db = require('@asl/schema');

const errorHandler = require('./error-handler');

const {omit} = require('lodash');

module.exports = settings => {

  const app = api(settings);

  const models = db(settings.db);

  app.protect('inspector');

  app.use((req, res, next) => {
    req.models = models;
    next();
  });

  app.use('/establishment(s?)', require('./routers/establishment'));

  app.use((req, res, next) => {
    if (res.response) {
      return res.json({
        data: res.response
      });
    }
    next();
  });

  app.use((req, res, next) => {
    next({ message: 'Not found', status: 404 });
  });

  app.use(errorHandler());

  return app;

};
