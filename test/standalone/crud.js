const { expect } = require('chai');
const jwt = require('jsonwebtoken');
const TheAPI = require('../../src');

describe('CRUD', () => {
  let api;
  let res;

  before(async () => {
    await global.dropDb();

    api = new TheAPI({ migrationDirs: [`${__dirname}/../migrations`] });

    const flags = await api.crud({
      table: 'flags',
    });

    const securedFlags = await api.crud({
      table: 'flags',
      prefix: 'secured_flags',
      rootRequired: ['add', 'get', 'update', 'delete'],
    });

    await api.up([
      api.extensions.errors,
      flags,
      securedFlags,
    ]);
  });

  after(() => api.down());

  describe('usual', () => {
    it('swagger returns 200 status code', async () => {
      res = await global.get('/swagger.yaml');
      expect(res.status).to.eql(200);
    });

    it('returns 404 status code for /unknown', async () => {
      res = await global.get('/unknown');
      expect(res.status).to.eql(404);
    });
  });

  describe('GET /flags', () => {
    it('returns 200 status code', async () => {
      res = await global.get('/flags');
      expect(res.status).to.eql(200);
    });
  });

  describe('GET /secured_flags ', () => {
    let token;

    it('returns 403 status code', async () => {
      res = await global.get('/secured_flags ');
      expect(res.status).to.eql(403);
    });

    it('get token', async () => {
      token = jwt.sign({
        id: -1,
        login: 'root',
        statuses: ['root'],
      }, process.env.JWT_SECRET, { expiresIn: '1h' });
    });

    it('returns 200 status code', async () => {
      res = await global.get('/secured_flags ', { Authorization: `Bearer ${token}` });
      expect(res.status).to.eql(200);
    });
  });
});
