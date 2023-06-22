const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Mail = require('./mail');
const { checkAccess } = require('../../lib');

const mail = new Mail();

const tokenFields = ['id', 'login', 'statuses', 'firstName'];

const sha256 = (data) => crypto.createHash('sha256').update(data, 'utf8').digest('hex');

async function loginTool({
  ctx, login: loginOrigin, email: emailOrigin, password, refresh, id: byId, superadminId,
}) {
  if (!loginOrigin && !emailOrigin && !refresh && !byId) return {};

  const { db, token: oldToken, jwtSecret } = ctx.state;

  const search = loginOrigin ? { login: loginOrigin }
    : emailOrigin ? { email: emailOrigin }
      : refresh ? { refresh } : { id: byId };

  const user = (await db('users').where({ ...search, deleted: false }).first());

  if (!user) return {};

  const {
    id, login, password: passDb, salt, statuses, firstName, secondName, email, options,
  } = user;
  if (loginOrigin && passDb !== sha256(password + salt)) return {};

  const forbidUnconfirmed = process.env.LOGIN_UNCONFIRMED_FORBID === 'true';
  if (statuses.includes('unconfirmed') && forbidUnconfirmed) return { id, statuses };

  const { JWT_EXPIRES_IN: expiresIn } = process.env;

  const dataToSign = tokenFields.reduce((acc, key) => { acc[`${key}`] = user[`${key}`]; return acc; }, {});

  const saId = oldToken?.superadmin_id || superadminId;
  if (saId) dataToSign.superadmin_id = saId;

  const token = jwt.sign(dataToSign, jwtSecret, { expiresIn: expiresIn || '1h' });
  const refreshNew = refresh || uuidv4();

  if (!refresh) await db('users').update({ refresh: refreshNew }).where({ id });

  return {
    id, login, statuses, token, firstName, secondName, email, options, refresh: refreshNew,
  };
}

async function getExternals(ctx) {
  const { token: { id }, db } = ctx.state;

  const user = await db('users').select(['externalProfiles']).where({ id }).first();

  ctx.body = user.externalProfiles?.map?.(({ provider }) => provider) || [];
}

async function deleteExternal(ctx) {
  const { external_name } = ctx.params;
  const { token: { id }, db } = ctx.state;

  const user = await db('users').select(['externalProfiles']).where({ id }).first();

  const profiles = user.externalProfiles?.filter(({ provider: p }) => p !== external_name) || [];

  await db('users').where({ id }).update({ externalProfiles: JSON.stringify(profiles) });

  ctx.body = { ok: 1 };
}

async function externalLogin({
  ctx, service, profile, externalId, firstName, secondName, email: e,
}) {
  const email = e?.toLowerCase();
  if (!service || !externalId) return ctx.throw('EXTERNALS_REQUIRED');

  const { db, jwtSecret, token } = ctx.state;
  const { JWT_EXPIRES_IN: expiresIn } = process.env;

  const where = token?.id ? { id: token?.id } : email ? { email } : '';
  if (!where) return ctx.throw('USER_NOT_FOUND');

  let user = await db('users').where(where).first();

  const _id = `${externalId}`;
  const { rows: userByServiceArr } = await db.raw(`SELECT * FROM users WHERE "externalProfiles" @> '[{"provider":??,"_id":??}]'`, [service, _id]);
  const userByService = userByServiceArr[0];

  // remove user service from other user
  if (user && userByService && user.id !== userByService.id) {
    const extProfiles = userByService.externalProfiles;
    const ep = Array.isArray(extProfiles) ? extProfiles : [];
    await db('users').where({ id: userByService.id }).update({
      externalProfiles: JSON.stringify(
        ep.filter((s) => s.provider !== service && s._id !== _id) || [],
      ),
    });
  }

  // add new user
  if (!user && !userByService) {
    const salt = uuidv4();
    const refresh = uuidv4();

    let login = email.replace(/(@.+)$/, '');
    const loginsRaw = await db('users').select(['login']).whereRaw('login ILIKE ?', [`${login}%`]);
    const logins = loginsRaw.map((item) => item.login);
    let i = 1;
    while (logins.includes(login)) {
      i += Math.floor(Math.random() * 100);
      login += i;
    }

    [user] = await db('users').insert({
      login,
      password: sha256(uuidv4() + salt),
      salt,
      email,
      firstName,
      secondName,
      refresh,
      statuses: ['registered'],
      externalProfiles: JSON.stringify([{ ...profile, _id }]),
    }).returning('*');
  } else if (!userByService || (user && user.id !== userByService.id)) {
    // add external profie to exists user
    await db('users').where(where).update({
      externalProfiles: JSON.stringify(
        [].concat(user.externalProfiles, { ...profile, _id }).filter(Boolean),
      ),
    });
  }

  if (!user && userByService) user = userByService;

  const result = {
    id: user.id,
    statuses: user.statuses,
    refresh: user.refresh,
    login: user.login,
    email: user.email,
    firstName,
    secondName,
  };

  const dataToSign = tokenFields.reduce((acc, key) => { acc[`${key}`] = user[`${key}`]; return acc; }, {});
  result.token = jwt.sign(dataToSign, jwtSecret, { expiresIn: expiresIn || '1h' });

  ctx.body = result;
  return ctx.body;
}

async function loginHandler(ctx) {
  const {
    login, email, password, refresh,
  } = ctx.request.body;

  const loginResult = await loginTool({
    ctx, login, email, password, refresh,
  });

  const { statuses } = loginResult;
  if (!statuses) return ctx.throw('USER_NOT_FOUND');
  const forbidUnconfirmed = process.env.LOGIN_UNCONFIRMED_FORBID === 'true';
  if (statuses.includes('unconfirmed') && forbidUnconfirmed) return ctx.throw('EMAIL_NOT_CONFIRMED');

  ctx.body = loginResult;
}

async function register(ctx) {
  const {
    login, password, email: e, firstName, secondName,
  } = ctx.request.body;
  const email = e?.toLowerCase();

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
    login, password: sha256(password + salt), salt, email, firstName, secondName, refresh: '', statuses, options,
  }).returning('*');

  ctx.body = await loginTool({ ctx, login, password });

  if (checkEmail) {
    const recover = uuidv4();

    await db('code').insert({
      user_id, login, code, recover, time: new Date(),
    });

    mail.register({
      code, login, password, email, firstName, secondName,
    });
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
  const { login, email: e } = ctx.request.body;
  const email = e?.toLowerCase();
  const { db } = ctx.state;

  ctx.body = { ok: 1 };

  if (!login && !email) return;

  const where = login ? { login } : { email };
  const { email: to, login: l } = await db('users').where({ ...where, deleted: false }).first() || {};

  if (!to) return;

  const code = uuidv4();

  await db('code').del().where({ login: l });
  await db('code').insert({ login: l, recover: code });

  mail.recover({ email: to, code, login: l });
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

  const { statuses = [] } = await db('users').where({ login }).first();
  if (!statuses.includes('registered')) statuses.push('registered');

  await db('users').update({ password: sha256(password + salt), salt, statuses }).where({ login });

  ctx.body = { ok: 1 };
}

async function updateUser(ctx) {
  const { token, db } = ctx.state;
  const {
    email: e, firstName, password, newPassword,
  } = ctx.request.body;
  const email = e?.toLowerCase();

  if (!token) return ctx.throw('NO_TOKEN');
  if (!token.id) return ctx.throw('TOKEN_INVALID');

  if (password && newPassword) {
    const { salt } = await db('users').where({ id: token.id }).first();

    const result = await db('users')
      .update({ password: sha256(newPassword + salt) })
      .where({ id: token.id, password: sha256(password + salt) });

    if (!result) return ctx.throw('WRONG_PASSWORD');
  }

  ctx.body = await db('users').update({ email, firstName }).where({ id: token.id });
}

async function addStatus(ctx) {
  await checkAccess.userAccess({ ctx, name: 'create status' });

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
  await checkAccess.userAccess({ ctx, name: 'delete status' });

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

async function getUserTokenBySuperadmin(ctx) {
  const { db, token } = ctx.state;
  const { user_id } = ctx.params;

  if (!token?.statuses?.includes('superadmin')) return ctx.throw('SUPERADMIN_REQUIRED');

  const user = await db('users').where({ id: user_id }).first();

  if (!user.refresh) {
    user.refresh = uuidv4();
    await db('users').update({ refresh: user.refresh }).where({ id: user_id });
  }

  ctx.body = await loginTool({
    ctx, refresh: user.refresh, superadminId: token.id,
  });
}

async function getSuperadminTokenBack(ctx) {
  const { db, token } = ctx.state;
  if (!token?.superadmin_id) return ctx.throw('SUPERADMIN_REQUIRED');

  const user = await db('users').where({ id: token?.superadmin_id }).first();

  ctx.body = await loginTool({
    ctx, refresh: user.refresh, superadminId: token.id,
  });
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
  getExternals,
  deleteExternal,
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
  getUserTokenBySuperadmin,
  getSuperadminTokenBack,
};
