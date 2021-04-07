const assert = require('assert');
const request = require('supertest');
const apiHelper = require('../../helpers/api');

describe('/rops', () => {

  before(() => {
    return apiHelper.create()
      .then((api) => {
        this.api = api.api;
        this.workflow = api.workflow;
      });
  });

  after(() => {
    return apiHelper.destroy();
  });

  it('can request a list of data exports', () => {
    return request(this.api)
      .get(`/rops/2021/export`)
      .expect(200)
      .expect(response => {
        assert.deepEqual(response.body.data, []);
      });
  });

  it('can create a new data export', () => {
    return request(this.api)
      .post(`/rops/2021/export`, { json: {} })
      .expect(200)
      .then(() => {
        assert.equal(this.workflow.handler.callCount, 1);
        const req = this.workflow.handler.firstCall.args[0];
        assert.equal(req.body.model, 'export');
        assert.equal(req.body.action, 'create');
        assert.equal(req.body.data.type, 'rops');
        assert.equal(req.body.data.key, '2021');
      });
  });

});
