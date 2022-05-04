const assert = require('assert');
const request = require('supertest');
const uuid = require('uuid').v4;
const apiHelper = require('../../helpers/api');
const ids = require('../../data/ids');

const caseIds = [uuid(), uuid(), uuid()];

const subjects = [
  {
    id: uuid(),
    profileId: ids.profiles.bruceBanner,
    establishmentId: ids.establishments.croydon,
    flags: [
      {
        modelType: 'profile',
        modelId: ids.profiles.bruceBanner,
        status: 'open'
      },
      {
        modelType: 'establishment',
        establishmentId: ids.establishments.croydon,
        status: 'open'
      }
    ]
  }
];

describe('/enforcement', () => {

  beforeEach(() => {
    return apiHelper.create()
      .then((api) => {
        this.api = api.api;
        this.db = api.api.app.db;
        this.workflow = api.workflow;
      });
  });

  beforeEach(() => {
    const { EnforcementCase } = this.db;

    return EnforcementCase.knex()
      .raw('TRUNCATE TABLE enforcement_cases CASCADE')
      .then(() => {
        return EnforcementCase.query().insertGraph([
          {
            id: caseIds[0],
            caseNumber: '10010',
            subjects
          },
          {
            id: caseIds[1],
            caseNumber: '10020'
          },
          {
            id: caseIds[2],
            caseNumber: '10030'
          }
        ]);
      });
  });

  afterEach(() => {
    return apiHelper.destroy();
  });

  describe('POST /', () => {
    it('triggers a create enforcement case workflow request', () => {
      return request(this.api)
        .post(`/enforcement`)
        .send({ data: { caseNumber: '12345' } })
        .expect(200)
        .then(() => {
          assert.strictEqual(this.workflow.handler.callCount, 1);
          const req = this.workflow.handler.firstCall.args[0];
          assert.strictEqual(req.body.model, 'enforcementCase');
          assert.strictEqual(req.body.action, 'create');
          assert.strictEqual(req.body.data.caseNumber, '12345');
        });
    });
  });

  describe('GET /', () => {
    it('can request the list of enforcement cases', () => {
      return request(this.api)
        .get(`/enforcement`)
        .expect(200)
        .expect(response => {
          assert.strictEqual(response.body.data.length, 3);
        });
    });
  });

  describe('GET /:caseId', () => {
    it('returns 404 for an unrecognised id', () => {
      return request(this.api)
        .get(`/enforcement/${uuid()}`)
        .expect(404);
    });

    it('can fetch a single enforcement case with subjects and flags included', () => {
      return request(this.api)
        .get(`/enforcement/${caseIds[0]}`)
        .expect(200)
        .then(response => {
          const enforcementCase = response.body.data;
          assert.strictEqual(enforcementCase.caseNumber, '10010');
          assert.strictEqual(enforcementCase.subjects[0].profileId, ids.profiles.bruceBanner);
          assert.strictEqual(enforcementCase.subjects[0].flags[0].modelType, 'profile');
          assert.strictEqual(enforcementCase.subjects[0].flags[0].status, 'open');
        });
    });
  });

  describe('PUT /:caseId/subject/:subjectId', () => {
    it('triggers an update-subject workflow request', () => {
      const input = {
        data: {
          subject: {
            ...subjects[0],
            caseId: caseIds[0],
            flags: [
              {
                ...subjects[0].flags[0],
                status: 'closed'
              }
            ]
          }
        }
      };

      return request(this.api)
        .put(`/enforcement/${caseIds[0]}/subject/${subjects[0].id}}`)
        .send(input)
        .expect(200)
        .then(() => {
          assert.strictEqual(this.workflow.handler.callCount, 1);
          const req = this.workflow.handler.firstCall.args[0];
          assert.strictEqual(req.body.model, 'enforcementCase');
          assert.strictEqual(req.body.action, 'update-subject');
          assert.deepEqual(req.body.data.subject, input.data.subject);
        });
    });
  });

  describe('GET /flags/:modelId', () => {
    it('can fetch all flags for an entity (profile)', () => {
      return request(this.api)
        .get(`/enforcement/flags/${ids.profiles.bruceBanner}`)
        .expect(200)
        .then(response => {
          const flags = response.body.data;
          assert.strictEqual(flags.length, 1);
          assert.strictEqual(flags[0].modelId, ids.profiles.bruceBanner);
          assert.strictEqual(flags[0].subject.id, subjects[0].id);
        });
    });

    it('can fetch all flags for an entity (establishment)', () => {
      return request(this.api)
        .get(`/enforcement/flags/${ids.establishments.croydon}`)
        .expect(200)
        .then(response => {
          const flags = response.body.data;
          assert.strictEqual(flags.length, 1);
          assert.strictEqual(flags[0].modelType, 'establishment');
          assert.strictEqual(flags[0].modelId, null);
          assert.strictEqual(flags[0].establishmentId, ids.establishments.croydon);
          assert.strictEqual(flags[0].subject.id, subjects[0].id);
        });
    });

    it('returns an empty array if there are no flags on an entity', () => {
      return request(this.api)
        .get(`/enforcement/flags/${ids.profiles.basic}`)
        .expect(200)
        .then(response => {
          const flags = response.body.data;
          assert.ok(Array.isArray(flags));
          assert.strictEqual(flags.length, 0);
        });
    });
  });

});
