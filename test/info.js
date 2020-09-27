const { expect } = require('chai');

describe('Info', () => {
  const api = new global.TheAPI();

  before(async () => {
    const { logs, errors, info, cache } = api.extensions;
    const { check } = api.routes;

    info.endpointsToShow(check);

    await api.up([
      logs,
      errors,
      cache,
      info,
    ]);
  });

  after(() => api.down());

  describe('GET /info', () => {
    let res;

    it('returns 200 status code', async () => {
      res = await global.get('/info');
      expect(res.status).to.eql(200);
    });

    it('returns 404 status code for /unknown', async () => {
      res = await global.get('/unknown');
      expect(res.status).to.eql(404);
    });

  });

});
