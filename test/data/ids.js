const uuid = require('uuid').v4;

module.exports = {
  establishments: {
    croydon: 100,
    marvell: 101
  },
  profiles: {
    licensing: uuid(),
    inspector: uuid(),
    rops: uuid(),
    bruceBanner: uuid()
  },
  projects: {
    croydon: {
      draftProject: uuid(),
      expiredProject: uuid(),
      activeProject: uuid(),
      revokedProject: uuid()
    }
  }
};
