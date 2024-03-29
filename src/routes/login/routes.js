const { Router } = require('../../lib');
const c = require('./controller');

const router = new Router();

module.exports = router
  .tag('users')
  .post('/register', c.register, {
    summary: 'Register new user',
    schema: {
      login: 'string',
      password: 'string',
      firstName: 'string',
      secondName: 'string',
      email: 'string',
    },
    required: ['password', 'email'],
  })
  .post('/register/check', c.check, {
    summary: 'Check',
    schema: {
      email: 'string',
      login: 'string',
      code: 'string',
    },
    required: ['code'],
  })
  .post('/register/resend', c.resend, {
    summary: 'Re-send e-mail with confirmation code',
    schema: {
      email: 'string',
    },
    required: ['email'],
  })
  .post('/login', c.loginHandler, {
    summary: 'Get jwt token',
    schema: {
      login: 'string',
      password: 'string',
    },
    required: ['password'],
    responses: ['USER_NOT_FOUND', 'EMAIL_NOT_CONFIRMED'],
  })
  .post('/login/refresh', c.loginHandler, {
    summary: 'Refresh jwt token',
    schema: {
      refresh: 'string',
    },
    required: ['refresh'],
    responses: ['USER_NOT_FOUND', 'EMAIL_NOT_CONFIRMED'],
  })
  .get('/login/refresh', c.loginHandler, {
    summary: 'Refresh jwt token',
    schema: {
      refresh: 'string',
    },
    required: ['refresh'],
    responses: ['USER_NOT_FOUND', 'EMAIL_NOT_CONFIRMED'],
  })
  .post('/login/forgot', c.restore, {
    summary: 'Get token to restore password',
    schema: {
      login: 'string',
      email: 'string',
    },
    required: ['login'],
  })
  .post('/login/restore', c.setPassword, {
    summary: 'Set new password by restore code',
    schema: {
      code: 'string',
      password: 'string',
    },
    required: ['code', 'password'],
  })
  .post('/login/email', c.setEmail, {
    summary: 'Set new email by restore code',
    schema: {
      code: 'string',
    },
    required: ['code'],
  })
  .patch('/login', c.updateUser, {
    summary: 'Update user',
    tokenRequired: true,
    schema: {
      email: 'string',
      firstName: 'string',
      secondName: 'string',
      password: 'string',
      newPassword: 'string',
    },
  })
  .get('/login/externals', c.getExternals, {
    tokenRequired: true,
    summary: `Get list of user's external services`,
  })
  .delete('/login/externals/:external_name', c.deleteExternal, {
    tokenRequired: true,
    summary: `Remove external service from user's profile`,
  })
  .post('/users/:user_id/statuses/:status_name', c.addStatus, {
    tokenRequired: true,
    summary: 'Create status',
  })
  .delete('/users/:user_id/statuses/:status_name', c.deleteStatus, {
    tokenRequired: true,
    summary: 'Delete status',
  })
  .get('/superadmin/tokens/:user_id', c.getUserTokenBySuperadmin, {
    summary: 'Get user token by superadmin',
    tokenRequired: true,
  })
  .delete('/superadmin/tokens', c.getSuperadminTokenBack, {
    summary: 'Get back superadmin token',
    tokenRequired: true,
  })
  .post('/emails/subscribe', c.subscribeUser, {
    summary: 'Allow the user to receive all emails',
    tokenRequired: true,
  })
  .delete('/emails/subscribe', c.unsubscribeUser, {
    summary: 'Unsubscribe the user from receiving incoming emails, except for the restore password email',
    tokenRequired: true,
  });

module.exports.setEmailTemplates = c.setEmailTemplates;
module.exports.addFieldsToToken = c.addFieldsToToken;
