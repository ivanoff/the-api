const Router = require('../../lib/router');
const c = require('./controller');
// const s = require('./swagger');

const router = new Router();

module.exports = router
  .post('/register', c.register, {
    summary: 'Register new user',
    schema: {
      login: 'string',
      password: 'string',
      first_name: 'string',
      second_name: 'string',
      email: 'string',
    },
  })
  .post('/register/check', c.check, {
    summary: 'Check',
    schema: {
      login: 'string',
      code: 'string',
    },
  })
  .post('/login', c.loginHandler, {
    summary: 'Get jwt token',
    schema: {
      login: 'string',
      password: 'string',
    },
    responses: ['USER_NOT_FOUND', 'EMAIL_NOT_CONFIRMED'],
    // examples: `curl 127.0.0.1:8877/login -H 'Content-Type: application/json' -d \
    // '{"login": "test", "password": "12345"}'`,
  })
  .post('/login/refresh', c.loginHandler, {
    summary: 'Refresh jwt token',
    schema: {
      token: 'string',
    },
    responses: ['USER_NOT_FOUND', 'EMAIL_NOT_CONFIRMED'],
  })
  .post('/login/forgot', c.restore, {
    summary: 'Get token to restore password',
    schema: {
      login: 'string',
    },
  })
  .post('/login/restore', c.setPassword, {
    summary: 'Set new password by restore code',
    schema: {
      code: 'string',
      password: 'string',
    },
  })
  .patch('/login', c.updateUser);

// const routerRest = new Router();
// module.exports.rest = routerRest
//   .post('/tokens', c.loginHandler)
//   .post('/users', c.register)
//   .post('/users', c.check)
//   .post('/users', c.restore)
//   .post('/users', c.setPassword);

module.exports.setEmailTemplates = c.setEmailTemplates;
module.exports.addFieldsToToken = c.addFieldsToToken;
