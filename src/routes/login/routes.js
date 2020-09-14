const Router = require('@koa/router');
const c = require('./controller');

const router = new Router();

module.exports = router
  .post('/register', c.register)
  .post('/register/check', c.check)
  .post('/login', c.loginHandler)
  .get('/login/restore', c.restore)
  .post('/login/restore', c.setPassword);

const routerRest = new Router();

module.exports.rest = routerRest
  .post('/tokens', c.loginHandler)
  .post('/users', c.register)
  .post('/users', c.check)
  .post('/users', c.restore)
  .post('/users', c.setPassword);
