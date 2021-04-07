const uuid = require('uuid').v4;

module.exports = {
  profiles: {
    licensing: uuid(),
    inspector: uuid(),
    rops: uuid()
  }
};
