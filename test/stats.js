const { expect } = require('chai');

describe('Stats', () => {
  const api = new global.TheAPI();

  before(async () => {
    const { logs, errors, limits, cache } = api.extensions;
    const { check } = api.routes;

    const test1 = api.router().get('/test', (ctx) => { ctx.body = { ok: 1 }; });
    const test2 = api.router().post('/test', (ctx) => { ctx.body = { ok: 1 }; });

    limits.setLimits({ 'GET /test': { minute: 2 } });

    cache.cacheTimeout(1000);

    await api.up([
      logs,
      errors,
      limits,
      cache,
      test1,
      test2,
    ]);
  });

  after(() => api.down());

  describe('GET /test', () => {
    let res;

    it('returns 200 status code', async () => {
      res = await global.get('/test');
      expect(res.status).to.eql(200);
    });

    it('cached returns 200 status code', async () => {
      res = await global.get('/test');
      expect(res.status).to.eql(200);
    });

    it('post returns 200 status code', async () => {
      res = await global.post('/test');
      expect(res.status).to.eql(200);
    });

    it('post not cached returns 200 status code', async () => {
      res = await global.post('/test');
      expect(res.status).to.eql(200);
    });

    it('returns 404 status code for /unknown', async () => {
      res = await global.get('/unknown');
      expect(res.status).to.eql(404);
    });

  });

  describe('GET /stats', () => {
    let res;

    it('returns 200 status code', async () => {
      const rawRes = await global.get('/stats');
      expect(rawRes.status).to.eql(200);
      res = await rawRes.json();
    });

    it('res has stat', async () => {
      expect(res).to.have.property('stat');
    });

    it('res.stat has total', async () => {
      expect(res.stat).to.have.property('total');
    });

    it('res.stat.total is 8', async () => {
      expect(res.stat.total).to.eql(8);
    });

    it('res.stat has minute', async () => {
      expect(res.stat).to.have.property('minute');
    });

    it('minute has /test', async () => {
      expect(res.stat.minute).to.have.property('/test');
    });

    it('minute /test is 2', async () => {
      expect(res.stat.minute['/test']).to.eql(2);
    });

  });

});
