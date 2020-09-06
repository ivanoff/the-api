const Router = require('@koa/router');
const c = require('./controller');

const router = new Router();

module.exports = router
  .post('/login', c.loginHandler)
  .post('/register', c.register);
