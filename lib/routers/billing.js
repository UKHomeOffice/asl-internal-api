const { Router } = require('express');
const permissions = require('@asl/service/lib/middleware/permissions');

const update = () => (req, res, next) => {
  const params = {
    model: 'feeWaiver',
    id: req.body.pilId,
    data: {
      ...req.body
    },
    action: req.body.waived ? 'create' : 'delete'
  };
  req.workflow.update(params)
    .then(response => {
      res.response = response;
      next();
    })
    .catch(next);
};

module.exports = () => {
  const app = Router({ mergeParams: true });

  app.get('/waiver',
    permissions('pil.updateBillable'),
    (req, res, next) => {
      const { FeeWaiver } = req.models;
      const { establishmentId, pilId } = req.query;
      const year = parseInt(req.query.year, 10);
      return FeeWaiver
        .query()
        .findOne({ establishmentId, pilId, year })
        .eager('waivedBy')
        .then(result => {
          res.response = result;
          next();
        })
        .catch(next);
    }
  );

  app.post('/waiver',
    permissions('pil.updateBillable'),
    update()
  );

  return app;
};
