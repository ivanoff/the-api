const { expect } = require('chai');

describe('Info', () => {
  const api = new global.TheAPI();

  before(async () => {
    const { logs, errors, info, access, cache } = api.extensions;
    const { check } = api.routes;

    info.endpointsToShow(check);

    await api.up([
      logs,
      errors,
      access,
      cache,
      info,
      check,
    ]);
  });

  after(() => api.down());

  describe('GET /info', () => {

    it('returns 200 status code', async () => {
      res = await global.get('/info');
      expect(res.status).to.eql(200);
    });

  });

});
