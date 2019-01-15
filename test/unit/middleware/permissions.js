const assert = require('assert');
const reqres = require('reqres');

const permissions = require('../../../lib/middleware/permissions');

describe('Permissions middleware', () => {

  let req;
  let res;

  beforeEach(() => {
    req = reqres.req();
    req.user = {
      profile: {
        asruAdmin: false,
        asruLicensing: false,
        asruInspector: false
      }
    };
    res = {};
  });

  it('will reject requests if the user does not hold the required role', done => {
    const middleware = permissions('admin');
    middleware(req, res, err => {
      try {
        assert(err);
        assert.equal(err.status, 403);
        done();
      } catch (e) {
        done(e);
      }
    });
  });

  it('will allow requests if the user has the role defined', done => {
    req.user.profile.asruAdmin = true;
    const middleware = permissions('admin');
    middleware(req, res, err => {
      try {
        assert(!err);
        done();
      } catch (e) {
        done(e);
      }
    });
  });

  it('supports multiple roles', done => {
    req.user.profile.asruAdmin = true;
    const middleware = permissions('licensing', 'admin');
    middleware(req, res, err => {
      try {
        assert(!err);
        done();
      } catch (e) {
        done(e);
      }
    });
  });

});
