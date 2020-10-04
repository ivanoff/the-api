const { expect } = require('chai');

describe('Stats', () => {
  const api = new global.TheAPI();

  before(async () => {
    const { logs, errors, limits, cache } = api.extensions;
    const { check } = api.routes;

    const test1 = api.router().get('/test1', (ctx) => { ctx.body = { ok: 1 }; });
    const test2 = api.router().get('/test2', (ctx) => { ctx.body = { ok: 1 }; });

    limits.setLimits({ 'GET /test1': { minute: 2 } });
    limits.setLimits({ '/test2': { minute: 2 } });

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

  describe('GET /test1', () => {
    let res;

    it('returns 200 status code', async () => {
      res = await global.get('/test1');
      expect(res.status).to.eql(200);
    });

    it('cached returns 200 status code', async () => {
      res = await global.get('/test1');
      expect(res.status).to.eql(200);
    });

    it('/test2 returns 200 status code', async () => {
      res = await global.get('/test2');
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

    it('res.stat.total is 3', async () => {
      expect(res.stat.total).to.eql(3);
    });

    it('res.stat has minute', async () => {
      expect(res.stat).to.have.property('minute');
    });

    it('minute has /test1', async () => {
      expect(res.stat.minute).to.have.property('/test1');
    });

    it('minute /test1 is 2', async () => {
      expect(res.stat.minute['/test1']).to.eql(2);
    });

    it('minute has /test2', async () => {
      expect(res.stat.minute).to.have.property('/test2');
    });

  });

});
