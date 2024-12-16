const { v4: uuid } = require('uuid');

module.exports = {
  establishments: {
    croydon: 100,
    marvell: 101,
    inactive: 999
  },
  profiles: {
    licensing: uuid(),
    inspector: uuid(),
    rops: uuid(),
    bruceBanner: uuid(),
    basic: uuid()
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
