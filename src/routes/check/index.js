const Router = require('@koa/router');

const router = new Router();

module.exports = router.get('/check', (ctx) => { ctx.body = { ok: 1 }; });

module.exports.examples = { 'curl localhost:8877/check': { ok: 1 } };
