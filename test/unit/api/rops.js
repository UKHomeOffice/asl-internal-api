const assert = require('assert');
const request = require('supertest');
const moment = require('moment');
const apiHelper = require('../../helpers/api');
const ids = require('../../data/ids');

describe('/rops', () => {

  before(() => {
    return apiHelper.create()
      .then((api) => {
        this.api = api.api;
        this.db = api.api.app.db;
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

  describe('rops summary', () => {
    const currentYear = moment().year();

    before(() => {
      const { Project } = this.db;

      return Project.query().insertGraph([
        {
          id: ids.projects.croydon.draftProject,
          establishmentId: ids.establishments.croydon,
          licenceHolderId: ids.profiles.bruceBanner,
          title: 'Draft project - no ROP required',
          licenceNumber: 'ppl-draft',
          schemaVersion: 1,
          status: 'inactive'
        },
        {
          id: ids.projects.croydon.activeProject,
          establishmentId: ids.establishments.croydon,
          licenceHolderId: ids.profiles.bruceBanner,
          title: 'Active project - ROP submitted',
          licenceNumber: 'ppl-active',
          schemaVersion: 1,
          status: 'active',
          issueDate: moment('2020-03-12').toISOString(),
          expiryDate: moment(`${currentYear + 1}-03-12`).toISOString(),
          rops: [
            { year: 2020, status: 'submitted', submittedDate: moment('2021-01-01').toISOString() }
          ]
        },
        {
          id: ids.projects.croydon.expiredProject,
          establishmentId: ids.establishments.croydon,
          licenceHolderId: ids.profiles.bruceBanner,
          title: 'Expired project - draft ROP (overdue)',
          licenceNumber: 'ppl-expired',
          schemaVersion: 1,
          status: 'expired',
          issueDate: moment('2020-03-12').toISOString(),
          expiryDate: moment('2020-09-12').toISOString(),
          rops: [
            { year: 2020, status: 'draft' }
          ]
        },
        {
          id: ids.projects.croydon.revokedProject,
          establishmentId: ids.establishments.croydon,
          licenceHolderId: ids.profiles.bruceBanner,
          title: 'Revoked project - no ROP (overdue)',
          licenceNumber: 'ppl-revoked',
          schemaVersion: 1,
          status: 'revoked',
          issueDate: moment('2020-03-12').toISOString(),
          expiryDate: moment(`${currentYear + 1}-03-12`).toISOString(),
          revocationDate: moment(`2020-12-01`).toISOString()
        }
      ]);
    });

    it('returns the correct summary counts for ROPS', () => {
      return request(this.api)
        .get(`/rops/2020/summary`)
        .expect(200)
        .expect(response => {
          const ropsSummary = response.body.data;
          assert.deepStrictEqual(ropsSummary.due, 3, 'there should be 3 rops due');
          assert.deepStrictEqual(ropsSummary.submitted, 1, 'there should be 1 rop submitted');
          assert.deepStrictEqual(ropsSummary.outstanding, 2, 'there should be 2 rops outstanding');
          assert.deepStrictEqual(ropsSummary.overdue, 2, 'there should be 2 rops overdue');
        });
    });

    it('returns the correct summary counts for ROPS by establishment', () => {
      return request(this.api)
        .get(`/rops/2020/establishments`)
        .expect(200)
        .expect(response => {
          const { data } = response.body;
          const croydonSummary = data.find(e => e.id === 100);
          assert.deepStrictEqual(croydonSummary.ropsDue, 3, 'there should be 3 rops due');
          assert.deepStrictEqual(croydonSummary.ropsSubmitted, 1, 'there should be 1 rop submitted');
          assert.deepStrictEqual(croydonSummary.ropsOutstanding, 2, 'there should be 2 rops outstanding');
          assert.deepStrictEqual(croydonSummary.ropsOverdue, 2, 'there should be 2 rops overdue');

          const marvellSummary = data.find(e => e.id === 101);
          assert.deepStrictEqual(marvellSummary.ropsDue, 0, 'there should be 0 rops due');
          assert.deepStrictEqual(marvellSummary.ropsSubmitted, 0, 'there should be 0 rops submitted');
          assert.deepStrictEqual(marvellSummary.ropsOutstanding, 0, 'there should be 0 rops outstanding');
          assert.deepStrictEqual(marvellSummary.ropsOverdue, 0, 'there should be 0 rops overdue');
        });
    });
  });

});
