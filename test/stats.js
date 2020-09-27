const { expect } = require('chai');

describe('Stats', () => {
  const api = new global.TheAPI();

  before(async () => {
    const { logs, errors, limits, cache } = api.extensions;
    const { check } = api.routes;

    cache.cacheTimeout(1000);

    await api.up([
      logs,
      errors,
      limits,
      cache,
      check,
    ]);
  });

  after(() => api.down());

  describe('GET /check', () => {
    let res;

    it('returns 200 status code', async () => {
      res = await global.get('/check');
      expect(res.status).to.eql(200);
    });

    it('cached returns 200 status code', async () => {
      res = await global.get('/check');
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

    it('res.stat has /check', async () => {
      expect(res.stat).to.have.property('/check');
    });

    it('res.stat /check is 1', async () => {
      expect(res.stat['/check']).to.eql(1);
    });

  });

});
