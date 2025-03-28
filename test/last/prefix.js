const { expect } = require('chai');

describe('Prefix', () => {
  const env = { ...process.env };
  const api = new global.TheAPI();

  before(async () => {
    process.env = { ...process.env, API_PREFIX: '/v1', NODE_ENV: 'test' };
    const { logs, errors } = api.extensions;
    const { check } = api.routes;

    const test = api.router().get('/test_prefix', (ctx) => { ctx.body = { ok: 1 }; });

    await api.up([
      logs,
      errors,
      check,
      test,
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

  describe('GET /v1/test_prefix', () => {
    let res;

    it('returns 404 status code for /test_prefix', async () => {
      res = await global.get('/test_prefix');
      expect(res.status).to.eql(404);
    });

    it('returns 200 status code for /v1/test_prefix', async () => {
      res = await global.get('/v1/test_prefix');
      expect(res.status).to.eql(200);
    });
  });
});
