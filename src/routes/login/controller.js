const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Mail = require('./mail');
const { checkAccess } = require('../../lib');

const mail = new Mail();

const tokenFields = ['id', 'login', 'statuses', 'first_name'];

const sha256 = (data) => crypto.createHash('sha256').update(data, 'utf8').digest('hex');

async function loginTool({
  ctx, login: loginOrigin, password, refresh, id: byId,
}) {
  if (!loginOrigin && !refresh && !byId) return {};

  const { db, jwtSecret } = ctx.state;

  const search = loginOrigin ? { login: loginOrigin } : refresh ? { refresh } : { id: byId };

  const user = (await db('users').where({ ...search, deleted: false }).first());

  if (!user) return {};

  const {
    id, login, password: passDb, salt, statuses, first_name, second_name, email, options,
  } = user;
  if (loginOrigin && passDb !== sha256(password + salt)) return {};

  const forbidUnconfirmed = process.env.LOGIN_UNCONFIRMED_FORBID === 'true';
  if (statuses.includes('unconfirmed') && forbidUnconfirmed) return { id, statuses };

  const { JWT_EXPIRES_IN: expiresIn } = process.env;

  const dataToSign = tokenFields.reduce((acc, key) => { acc[`${key}`] = user[`${key}`]; return acc; }, {});
  const token = jwt.sign(dataToSign, jwtSecret, { expiresIn: expiresIn || '1h' });
  const refreshNew = refresh || uuidv4();

  if (!refresh) await db('users').update({ refresh: refreshNew }).where({ id });

  return {
    id, login, statuses, token, first_name, second_name, email, options, refresh: refreshNew,
  };
}

async function externalLogin({
  ctx, service, profile, external_id, first_name, second_name, email,
}) {
  if (!service || !external_id) return ctx.throw('EXTERNALS_REQUIRED');

  const { db, jwtSecret } = ctx.state;
  const { JWT_EXPIRES_IN: expiresIn } = process.env;

  const refresh = uuidv4();

  let user = await db('users').where({ email }).first();

  const _id = `${external_id}`;
  const { rows: userByServiceArr } = await db.raw(`SELECT * FROM users WHERE external_profiles @> '[{"provider":??,"_id":??}]'`, [service, _id]);

  const userByService = userByServiceArr[0];

  if (!user && userByService) user = userByService;

  if (!user) {
    const salt = uuidv4();

    [user] = await db('users').insert({
      login: email,
      password: sha256(uuidv4() + salt),
      salt,
      email,
      first_name,
      second_name,
      refresh,
      statuses: ['registered'],
      external_profiles: JSON.stringify([{ ...profile, _id }]),
    }).returning('*');
  } else if (!userByService) {
    await db('users').where({ email }).update({
      external_profiles: JSON.stringify(
        [].concat(user.external_profiles, { ...profile, _id }).filter(Boolean),
      ),
    });
  }

  const result = {
    id: user.id,
    statuses: user.statuses,
    refresh: user.refresh,
    login: user.login,
    email: user.email,
    first_name,
    second_name,
  };

  const dataToSign = tokenFields.reduce((acc, key) => { acc[`${key}`] = user[`${key}`]; return acc; }, {});
  result.token = jwt.sign(dataToSign, jwtSecret, { expiresIn: expiresIn || '1h' });

  ctx.body = result;
}

async function loginHandler(ctx) {
  const { login, password, refresh } = ctx.request.body;

  const loginResult = await loginTool({
    ctx, login, password, refresh,
  });

  const { statuses } = loginResult;
  if (!statuses) return ctx.throw('USER_NOT_FOUND');
  const forbidUnconfirmed = process.env.LOGIN_UNCONFIRMED_FORBID === 'true';
  if (statuses.includes('unconfirmed') && forbidUnconfirmed) return ctx.throw('EMAIL_NOT_CONFIRMED');

  ctx.body = loginResult;
}

async function register(ctx) {
  const {
    login, password, email, first_name, second_name,
  } = ctx.request.body;

  if (!login) return ctx.throw('LOGIN_REQUIRED');

  const { db } = ctx.state;
  const salt = uuidv4();

  const userLogin = (await db('users').where({ login }).first());
  if (userLogin) return ctx.throw('LOGIN_EXISTS');

  const userEmail = email && (await db('users').where({ email }).first());
  if (userEmail) return ctx.throw('EMAIL_EXISTS');

  const code = uuidv4();
  const options = JSON.stringify({ email: { on: true } });
  const checkEmail = process.env.LOGIN_CHECK_EMAIL === 'true';
  const statuses = email && checkEmail ? ['unconfirmed'] : ['registered'];

  const [{ id: user_id }] = await db('users').insert({
    login, password: sha256(password + salt), salt, email, first_name, second_name, refresh: '', statuses, options,
  }).returning('*');

  ctx.body = await loginTool({ ctx, login, password });

  if (checkEmail) {
    const recover = uuidv4();

    await db('code').insert({
      user_id, login, code, recover, time: new Date(),
    });

    mail.register({ code, ...ctx.request.body });
  }
}

async function check(ctx) {
  const { login, code } = ctx.request.body;
  const { db } = ctx.state;

  if (!code || !login) return ctx.throw('WRONG_CODE');

  const expireIn = +process.env.LOGIN_CHECK_EMAIL_DELAY || 60;
  await db('code').del().where('time', '>', new Date((new Date()).getTime() + 1000 * 60 * expireIn));

  await db.raw('update code set attempts = attempts+1 where login=?', [login]);

  const data = await db('code').where({ login, code }).where('attempts', '<', 3).first();

  if (!data) return ctx.throw('WRONG_CODE');

  const { user_id: id } = data;
  await db('users').update({ statuses: ['registered'] }).where({ id });
  await db('code').del().where({ login, code });

  ctx.body = await loginTool({ ctx, id });
}

async function restore(ctx) {
  const { login, email } = ctx.request.body;
  const { db } = ctx.state;

  ctx.body = { ok: 1 };

  if (!login && !email) return;

  const where = login ? { login } : { email };
  const { email: to, login: l } = await db('users').where({ ...where, deleted: false }).first() || {};

  if (!to) return;

  const code = uuidv4();

  await db('code').del().where({ login: l });
  await db('code').insert({ login, recover: code });

  mail.recover({ email: to, code });
}

async function setPassword(ctx) {
  const { code, password } = ctx.request.body;
  const { db } = ctx.state;

  const expireIn = +process.env.LOGIN_CHECK_EMAIL_DELAY || 60;
  const expireTime = new Date((new Date()).getTime() - 1000 * 60 * expireIn);
  const { login } = await db('code').where({ recover: code }).where('time', '>', expireTime).first() || {};

  if (!login) return ctx.throw('WRONG_CODE');

  await db('code').del().where({ recover: code });

  const salt = uuidv4();

  await db('users').update({ password: sha256(password + salt), salt }).where({ login });

  ctx.body = { ok: 1 };
}

async function updateUser(ctx) {
  const { token, db } = ctx.state;
  const { email, first_name } = ctx.request.body;

  if (!token) return ctx.throw('NO_TOKEN');
  if (!token.id) return ctx.throw('TOKEN_INVALID');

  ctx.body = await db('users').update({ email, first_name }).where({ id: token.id });
}

async function addStatus(ctx) {
  await checkAccess.userAccess(ctx, 'create status');

  const { db } = ctx.state;
  const { user_id, status_name } = ctx.params;

  if (['default', 'owner'].includes(status_name)) return ctx.throw('FORBIDDEN_STATUS_NAME');

  const user = await db('users').where({ id: user_id }).first();
  if (!user) return ctx.throw('USER_NOT_FOUND');

  const { statuses = [] } = user;
  if (!statuses.includes(status_name)) {
    statuses.push(status_name);
    ctx.body = await db('users').update({ statuses }).where({ id: user_id });
  }
  ctx.body = statuses;
}

async function deleteStatus(ctx) {
  await checkAccess.userAccess(ctx, 'delete status');

  const { db } = ctx.state;
  const { user_id, status_name } = ctx.params;

  const user = await db('users').where({ id: user_id }).first();
  if (!user) return ctx.throw('USER_NOT_FOUND');

  let { statuses = [] } = user;
  if (statuses.includes(status_name)) {
    statuses = statuses.filter((item) => item !== status_name);
    ctx.body = await db('users').update({ statuses }).where({ id: user_id });
  }
  ctx.body = statuses;
}

async function setEmailTemplates(templates = {}) {
  for (const [key, value] of Object.entries(templates)) {
    mail.templates[`${key}`] = value;
  }
}

async function addFieldsToToken(...fields) {
  tokenFields.push(fields);
}

module.exports = {
  loginHandler,
  externalLogin,
  register,
  check,
  restore,
  setPassword,
  updateUser,
  addStatus,
  deleteStatus,
  setEmailTemplates,
  addFieldsToToken,
};
