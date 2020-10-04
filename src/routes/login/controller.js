const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { getCode } = require('../../lib');
const Mail = require('./mail');

const mail = new Mail();

const sha256 = (data) => crypto.createHash('sha256').update(data, 'utf8').digest('hex');

async function loginTool({
  ctx, login, password, refresh, id: byId,
}) {
  if (!login && !refresh && !byId) return {};

  const { db, jwtSecret } = ctx.state;

  const search = login ? { login } : refresh ? { refresh } : { id: byId };

  const user = (await db('users').where({ ...search, deleted: false }).first());

  if (!user) return {};

  const {
    id, password: passDb, salt, status, name, second_name, email, options,
  } = user;
  if (login && passDb !== sha256(password + salt)) return {};

  if (status === 'unconfirmed') return { id, status };

  const { JWT_EXPIRES_IN: expiresIn } = process.env;
  const token = jwt.sign({
    id, login, status, name,
  }, jwtSecret, { expiresIn: expiresIn || '1h' });
  const refreshNew = uuidv4();

  await db('users').update({ refresh: refreshNew }).where({ id });

  return {
    id, status, token, name, second_name, email, options, refresh: refreshNew,
  };
}

async function loginHandler(ctx) {
  const { login, password, refresh } = ctx.request.body;

  const loginResult = await loginTool({
    ctx, login, password, refresh,
  });

  const { status } = loginResult;
  if (!status) return ctx.warning('USER_NOT_FOUND');
  if (status === 'unconfirmed') return ctx.warning('EMAIL_NOT_CONFIRMED');

  ctx.body = loginResult;
}

async function register(ctx) {
  const {
    login, password, email, firstName, secondName,
  } = ctx.request.body;

  if (!login) return ctx.warning('LOGIN_REQUIRED');

  const { db } = ctx.state;
  const salt = uuidv4();

  const userLogin = (await db('users').where({ login }).first());
  if (userLogin) return ctx.warning('LOGIN_EXISTS');

  const userEmail = email && (await db('users').where({ email }).first());
  if (userEmail) return ctx.warning('EMAIL_EXISTS');

  const code = getCode();
  const options = JSON.stringify({ email: { on: true } });
  const checkEmail = process.env.LOGIN_CHECK_EMAIL === 'true';
  const status = checkEmail ? 'unconfirmed' : 'registered';

  await db('users').insert({
    login, password: sha256(password + salt), salt, email, first_name: firstName, second_name: secondName, refresh: '', status, options,
  });

  ctx.body = await loginTool({ ctx, login, password });

  if (checkEmail) {
    const recover = uuidv4();

    await db('code').insert({
      login, code, recover, time: (new Date()).getTime(),
    });

    mail.check({ email, code });
  }
}

async function check(ctx) {
  const { login, code } = ctx.request.body;
  const { db } = ctx.state;

  if (!code || !login) return ctx.warning('WRONG_CODE');

  const expireIn = +process.env.LOGIN_CHECK_EMAIL_DELAY || 60;
  await db('code').del().where('time', '>', (new Date((new Date()).getTime() + 1000 * 60 * expireIn)).getTime());

  await db.raw('update code set attempts = attempts+1 where login=?', [login]);

  const data = await db('code').where({ login, code }).where('attempts', '<', 3).first();

  if (!data) return ctx.warning('WRONG_CODE');

  const { id: restoredId } = data;
  await db('users').update({ status: 'registered' }).where({ id: restoredId });
  await db('code').del().where({ login, code });

  ctx.body = await loginTool({ ctx, id: restoredId });
}

async function restore(ctx) {
  const { login, email } = ctx.request.body;
  const { db } = ctx.state;

  ctx.body = { ok: 1 };

  if (!login && !email) return;

  const where = login ? { login } : { email };
  const { email: to, login: l } = await db('users').where({ ...where, deleted: false }).first() || {};

  if (!to) return;

  const recover = uuidv4();

  await db('code').del().where({ login: l });
  await db('code').insert({ login, recover });

  mail.recover({ email: to, recover });
}

async function setPassword(ctx) {
  const { code, password } = ctx.request.body;
  const { db } = ctx.state;

  const expireIn = +process.env.LOGIN_CHECK_EMAIL_DELAY || 60;
  const expireTime = new Date((new Date()).getTime() - 1000 * 60 * expireIn);
  const { login } = await db('code').where({ recover: code }).where('time', '>', expireTime).first() || {};

  if (!login) return ctx.warning('WRONG_CODE');

  await db('code').del().where({ recover: code });

  const salt = uuidv4();

  await db('users').update({ password: sha256(password + salt), salt }).where({ login });

  ctx.body = { ok: 1 };
}

module.exports = {
  loginHandler,
  register,
  check,
  restore,
  setPassword,
};
