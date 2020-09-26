const { expect } = require('chai');

describe('Access', () => {
  const api = new global.TheAPI();
  const { access } = api.extensions;

  before(async () => {
    const { errors, token, info } = api.extensions;
    const { check, login } = api.routes;

    api.router().get('/test', (ctx) => { ctx.body = { ok: 1 }; });

    await api.up([
      errors,
      login,
      token,
      access,
      info,
      check,
    ]);
  });

  after(() => api.down());

  describe('GET /check', () => {
    let res;
    let token;

    it('status code 200', async () => {
      await global.post('/register', { login: 'aaa5', password: 'bbb', email: '2@ivanoff.org.ua' });
      const raw = await global.post('/login', { login: 'aaa5', password: 'bbb' });
      res = await raw.json();
      expect(raw.status).to.eql(200);
      token = res.token;
      access.endpointsToLimit(token, '/check', 2);
      access.endpointsToLimit(token, 'total', 3);
    });

    it('GET /check', async () => {
      res = await global.get('/check', {Authorization: `Bearer ${token}`});
      expect(res.status).to.eql(200);
    });

    it('returns 200 status code', async () => {
      res = await global.get('/check', {Authorization: `Bearer ${token}`});
      expect(res.status).to.eql(200);
    });

    it('limited returns 403 status code', async () => {
      res = await global.get('/check', {Authorization: `Bearer ${token}`});
      expect(res.status).to.eql(403);
    });

    it('GET /info 200 status code', async () => {
      res = await global.get('/info', {Authorization: `Bearer ${token}`});
      expect(res.status).to.eql(200);
    });

    it('total limit reached - 403 code', async () => {
      res = await global.get('/info', {Authorization: `Bearer ${token}`});
      expect(res.status).to.eql(403);
    });

    it('again total limit reached - 403 code', async () => {
      res = await global.get('/test', {Authorization: `Bearer ${token}`});
      expect(res.status).to.eql(403);
    });

  });

});
