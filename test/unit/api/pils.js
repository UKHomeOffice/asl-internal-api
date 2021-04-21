const assert = require('assert');
const request = require('supertest');
const { v4: uuid } = require('uuid');
const apiHelper = require('../../helpers/api');
const ids = require('../../data/ids');

describe('/profile/:id/pil', () => {

  before(() => {
    return apiHelper.create()
      .then((api) => {
        this.api = api.api;
        this.db = api.api.app.db;
      });
  });

  before(() => {
    const { Profile, PIL, Project, TrainingCourse } = this.db;
    this.id1 = uuid();
    this.id2 = uuid();
    this.id3 = uuid();
    const projectId = uuid();

    return Promise.resolve()
      .then(() => Profile.query().insert([
        {
          id: this.id1,
          firstName: 'Alison',
          lastName: 'Pill',
          email: 'alison.pill@example.com'
        },
        {
          id: this.id2,
          firstName: 'Jagged Little',
          lastName: 'Pill',
          email: 'alanis@example.com'
        },
        {
          id: this.id3,
          firstName: 'No',
          lastName: 'Pills',
          email: 'nopills@example.com'
        }
      ]))
      .then(() => Project.query().insert([
        {
          title: 'Training Project',
          id: projectId,
          establishmentId: ids.establishments.croydon,
          status: 'active'
        }
      ]))
      .then(() => TrainingCourse.query().insertGraph([
        {
          title: 'Spellign',
          establishmentId: ids.establishments.croydon,
          species: ['mice'],
          startDate: '2020-06-01',
          projectId,
          trainingPils: [
            {
              profileId: this.id1,
              status: 'expired',
              issueDate: '2020-06-01T12:00:00.000Z',
              expiryDate: '2020-09-01T12:00:00.000Z',
              trainingNeed: 'Some things'
            },
            {
              profileId: this.id2,
              status: 'expired',
              issueDate: '2020-06-02T12:00:00.000Z',
              expiryDate: '2020-09-02T12:00:00.000Z',
              trainingNeed: 'Some other things'
            }
          ]
        }
      ]))
      .then(() => PIL.query().insertGraph([
        {
          profileId: this.id1,
          establishmentId: ids.establishments.croydon,
          species: ['mice'],
          status: 'active',
          issueDate: '2015-01-01T12:00:00.000Z'
        },
        {
          profileId: this.id1,
          establishmentId: ids.establishments.marvell,
          species: ['rats'],
          status: 'revoked',
          issueDate: '2013-01-01T12:00:00.000Z',
          revocationDate: '2014-01-01T12:00:00.000Z',
          pilTransfers: [
            {
              createdAt: '2013-07-01T12:00:00.000Z',
              fromEstablishmentId: ids.establishments.croydon,
              toEstablishmentId: ids.establishments.marvell
            }
          ]
        }
      ]));
  });

  after(() => {
    return apiHelper.destroy();
  });

  it('returns all PILs for a user', () => {
    return request(this.api)
      .get(`/profile/${this.id1}/pil`)
      .expect(200)
      .then(response => {
        const data = response.body.data;
        assert.equal(data.pils.length, 2);
        assert.equal(data.trainingPils.length, 1);
      });
  });

  it('eager loads establishment information', () => {
    return request(this.api)
      .get(`/profile/${this.id1}/pil`)
      .expect(200)
      .then(response => {
        const data = response.body.data;
        assert.equal(data.pils[0].establishment.name, 'Marvell Pharmaceuticals');
        assert.equal(data.pils[1].establishment.name, 'University of Croydon');
      });
  });

  it('eager loads training course information', () => {
    return request(this.api)
      .get(`/profile/${this.id1}/pil`)
      .expect(200)
      .then(response => {
        const data = response.body.data;
        assert.equal(data.trainingPils[0].trainingCourse.title, 'Spellign');
        assert.equal(data.trainingPils[0].trainingCourse.establishment.name, 'University of Croydon');
        assert.equal(data.trainingPils[0].trainingCourse.project.title, 'Training Project');
      });
  });

  it('eager loads transfer history', () => {
    return request(this.api)
      .get(`/profile/${this.id1}/pil`)
      .expect(200)
      .then(response => {
        const data = response.body.data;
        assert.equal(data.pils[0].pilTransfers[0].from.name, 'University of Croydon');
        assert.equal(data.pils[0].pilTransfers[0].to.name, 'Marvell Pharmaceuticals');
      });
  });

  it('returns empty arrays for a user with no PILs', () => {
    return request(this.api)
      .get(`/profile/${this.id3}/pil`)
      .expect(200)
      .then(response => {
        const data = response.body.data;
        assert.equal(data.pils.length, 0);
        assert.equal(data.trainingPils.length, 0);
      });
  });

});
