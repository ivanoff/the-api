const { expect } = require('chai');
const { sleep } = require('../src/lib');

describe('Token', () => {
  const api = new global.TheAPI();
  const env = { ...process.env };

  before(async () => {
    process.env = { NODE_ENV: 'test_log', JWT_EXPIRES_IN: '1100ms' };
    const { logs, errors, token } = api.extensions;
    const { login, check } = api.routes;

    await api.up([
      logs,
      errors,
      login,
      token,
      check,
    ]);
  });

  after(() => {
    api.down();
    process.env = env;
  });

  describe('GET /check with token', () => {
    let res;
    let token;

    it('status code 200', async () => {
      await global.post('/register', { login: 'aaa5', password: 'bbb', email: '2@ivanoff.org.ua' });
      const raw = await global.post('/login', { login: 'aaa5', password: 'bbb' });
      res = await raw.json();
      expect(raw.status).to.eql(200);
    });

    it('has token', async () => {
      token = res.token;
      expect(token);
    });

    it('GET /check', async () => {
      res = await global.get('/check', {Authorization: `Bearer ${token}`});
      expect(res.status).to.eql(200);
    });

    it('expires GET /check', async () => {
      await sleep(1300);
      res = await global.get('/check', {Authorization: `Bearer ${token}`});
      expect(res.status).to.eql(403);
    });
  });

  describe('GET /check without token', () => {

    it('returns 401 status code', async () => {
      res = await global.get('/check');
      expect(res.status).to.eql(401);
    });

  });

  describe('GET /check with wrong token', () => {

    it('returns 401 status code', async () => {
      res = await global.get('/check', {Authorization: `Bearer aaa`});
      expect(res.status).to.eql(403);
    });

  });

});
