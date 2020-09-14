const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const { sha256 } = require('js-sha256');
const { getCode } = require('../../lib');
const Mail = require('./mail');

const mail = new Mail();

async function loginTool({
  ctx, login, password, refresh, id: byId,
}) {
  if (!login && !refresh && !byId) return {};

  const { db, jwtToken } = ctx.state;

  const search = login ? { login } : refresh ? { refresh } : { id: byId };

  const user = (await db('users').where({ ...search, deleted: false }).first());

  if (!user) return {};

  const {
    id, password: passDb, salt, status, name, second_name, email, options,
  } = user;
  if (login && passDb !== sha256(password + salt)) return {};

  if (status === 'unconfirmed') return { status };

  const token = jwt.sign({
    id, login, status, name,
  }, jwtToken, { expiresIn: '1h' });
  const refreshNew = uuidv4();

  await db('users').update({ refresh: refreshNew }).where({ id });

  return {
    id, status, token, name, second_name, email, options, refresh: refreshNew,
  };
}

async function loginHandler(ctx) {
  const { login, password, refresh } = ctx.request.body || {};

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
  const { db } = ctx.state;
  const salt = uuidv4();

  const userLogin = (await db('users').where({ login }).first());
  if (userLogin) return ctx.warning('LOGIN_EXISTS');

  if (email) {
    const userEmail = (await db('users').where({ email }).first());
    if (userEmail) return ctx.warning('EMAIL_EXISTS');
  }

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
      user_id: ctx.body.id, code, recover, time: new Date(),
    });
    mail.check({ email, code });
  }
}

async function check(ctx) {
  const { id, code, recover } = ctx.request.body;
  const { db } = ctx.state;

  const expireIn = +process.env.LOGIN_CHECK_EMAIL_DELAY || 60;
  await db('code').del().where('time', '>', new Date((new Date()).getTime() - 1000 * 60 * expireIn));

  if (id) await db.raw('update code set attempts = attempts+1 where user_id=?', [id]);

  const query = recover ? { recover } : { user_id: id, code };
  const data = await db('code').where(query).where('attempts', '<', 3).first();

  if (!data) return ctx.warning('WRONG_CODE');

  const { id: restoredId } = data;
  await db('code').update({ status: 'registered' }).where({ id: restoredId });

  ctx.body = await loginTool({ id: restoredId });
}

async function restore(ctx) {
  const { login, email } = ctx.request.body;
  const { db } = ctx.state;

  const { id: user_id, email: to } = await db('users').where(() => this.where({ login }).orWhere({ email })).where({ deleted: false }).first();

  if (user_id) {
    const recover = uuidv4();

    await db('code').del().where({ user_id });
    await db('code').insert({ user_id, recover });

    mail.recover({ email: to, recover });
  }

  ctx.body = { ok: 1 };
}

async function setPassword(ctx) {
  const { code, password } = ctx.request.body;
  const { db } = ctx.state;

  const expireIn = +process.env.LOGIN_CHECK_EMAIL_DELAY || 60;
  const { user_id } = await db('code').where({ recover: code }).where('time', '>', new Date((new Date()).getTime() - 1000 * 60 * expireIn)).first();

  if (!user_id) return ctx.warning('WRONG_CODE');

  await db('code').del().where({ recover: code });

  const salt = uuidv4();

  await db('users').update({ password: sha256(password + salt), salt }).where({ id: user_id });

  ctx.body = { ok: 1 };
}

module.exports = {
  loginHandler,
  register,
  check,
  restore,
  setPassword,
};
