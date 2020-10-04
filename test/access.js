const { expect } = require('chai');

describe('Access', () => {
  const api = new global.TheAPI();
  const { limits } = api.extensions;

  before(async () => {
    const { errors, access, info } = api.extensions;
    const { check, login } = api.routes;

    const test = api.router().get('/test', (ctx) => { ctx.body = { ok: 1 }; });

    await api.up([
      errors,
      login,
      access,
      limits,
      test,
    ]);
  });

  after(() => api.down());

  describe('GET /test', () => {
    let res;
    let token;

    it('status code 200', async () => {
      await global.post('/register', { login: 'aaa5', password: 'bbb', email: '2@ivanoff.org.ua' });
      const raw = await global.post('/login', { login: 'aaa5', password: 'bbb' });
      res = await raw.json();
      expect(raw.status).to.eql(200);
      token = res.token;
      limits.setLimits({ 'GET /test': { minute: 2 } });
    });

    it('GET /check', async () => {
      res = await global.get('/test', {Authorization: `Bearer ${token}`});
      expect(res.status).to.eql(200);
    });

    it('returns 200 status code', async () => {
      res = await global.get('/test', {Authorization: `Bearer ${token}`});
      expect(res.status).to.eql(200);
    });

    it('limited returns 403 status code', async () => {
      res = await global.get('/test', {Authorization: `Bearer ${token}`});
      expect(res.status).to.eql(403);
    });

    it('limited returns 403 status code again', async () => {
      res = await global.get('/test', {Authorization: `Bearer ${token}`});
      expect(res.status).to.eql(403);
    });

  });

});
