import { Router } from '../../lib';
import c from './controller';

const router = new Router();

export default router
  .tag('users')
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
  })
  .post('/login/refresh', c.loginHandler, {
    summary: 'Refresh jwt token',
    schema: {
      refresh: 'string',
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
  .patch('/login', c.updateUser, {
    summary: 'Update user',
    tokenRequired: true,
    schema: {
      code: 'string',
      password: 'string',
    },
  })
  .post('/users/:user_id/statuses/:status_name', c.addStatus, {
    tokenRequired: true,
    summary: `Create status`,
  })
  .delete('/users/:user_id/statuses/:status_name', c.deleteStatus, {
    tokenRequired: true,
    summary: 'Delete status',
  });
