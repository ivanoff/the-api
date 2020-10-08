const { expect } = require('chai');

describe.skip('Prefix', () => {
  const env = { ...process.env };
  const api = new global.TheAPI();

  before(async () => {
    process.env = { PREFIX: '/v1', NODE_ENV: 'test' };
    const { logs, errors, info, cache } = api.extensions;
    const { check } = api.routes;

    info.endpointsToShow(check);

    await api.up([
      logs,
      errors,
      cache,
      info,
      check,
    ]);
  });

  after(() => {
    api.down();
    process.env = env;
  });

  describe('GET /v1/check', () => {
    let res;

    it('returns 404 status code for /check', async () => {
      res = await global.get('/check');
      expect(res.status).to.eql(404);
    });

    it('returns 200 status code for /v1/check', async () => {
      res = await global.get('/v1/check');
      expect(res.status).to.eql(200);
    });

  });

  describe('GET /v1/info', () => {
    let res;

    it('returns 404 status code for /info', async () => {
      res = await global.get('/info');
      expect(res.status).to.eql(404);
    });

    it('returns 200 status code for /v1/info', async () => {
      res = await global.get('/v1/info');
      expect(res.status).to.eql(200);
    });

  });

});
