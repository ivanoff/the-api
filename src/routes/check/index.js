const Router = require('@koa/router');

const router = new Router();

module.exports = router.get('/check', (ctx) => { ctx.body = { ok: 1 }; });

module.exports = router.get('/check/aaa', (ctx) => { ctx.body = { ok: '!!!!!!!!!!!!11' }; });

module.exports = router.get('/check/:id', (ctx) => { ctx.body = { ok: ctx.params }; });

module.exports.examples = { 'curl localhost:8877/check': { ok: 1 } };
