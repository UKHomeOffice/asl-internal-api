const { Router } = require('express');

const router = Router();

router.get('/', (req, res, next) => {

  req.models.Establishment.findAll()
    .then(list => {
      res.response = list;
    })
    .then(() => next())
    .catch(next);

});

module.exports = router;
