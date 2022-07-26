const { expect } = require('chai');
const Koa = require('koa');
const RouterHandler = require('../src/lib/router');

const fetch = (...args) => import('node-fetch').then(({ default: fetch2 }) => fetch2(...args));
const app = new Koa();
const router = new RouterHandler();

describe('Route Handler', () => {
  let connection;

  before(async () => {
    router.get('/', async (ctx, next) => {
      ctx.body = 'ok';
      await next();
    }, { ok: 1 });

    app
      .use(router.routes())
      .use(router.allowedMethods());

    connection = await app.listen(3000);
  });

  after(async () => connection.close());

  describe('GET /', () => {
    it('GET /', async () => {
      const res = await fetch('http://localhost:3000');

      expect(res.status).to.eql(200);
      expect(await res.text()).to.eql('ok');
    });
  });
});
