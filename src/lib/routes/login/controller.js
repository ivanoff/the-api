const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const getCode = require('../../utils');

async function loginTool({
  ctx, login, password, refresh, id: byId,
}) {
  const { db } = ctx.state;

  const getUsersSql = 'select * from users where 1=1 AND NOT deleted';
  const data = login ? await db.raw(`${getUsersSql} AND login=? AND password=md5(? || salt)`, [login, password])
    : refresh ? await db.raw(`${getUsersSql} AND refresh=?`, [refresh])
      : byId ? await db.raw(`${getUsersSql} AND id =?`, [byId])
        : {};

  if (!data.rowCount) return {};

  const {
    id, status, name, second_name, email, options,
  } = data.rows[0];
  if (status === 'unconfirmed') return { status };

  const token = jwt.sign({
    id, login, status, name,
  }, process.env.JWT_SIGN, { expiresIn: '1h' });
  const refreshNew = uuidv4();

  await db.raw('update users set refresh=? where id=?', [refreshNew, id]);
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

  let data = await db.raw('select * from users where login=?', [login]);
  if (data.rowCount) return ctx.warning('LOGIN_EXISTS');

  if (email) {
    data = await db.raw('select * from users where email=?', [email]);
    if (data.rowCount) return ctx.warning('EMAIL_EXISTS');
  }

  const code = getCode();
  const options = JSON.stringify({ email: { on: true } });
  const checkEmail = process.env.LOGIN_CHECK_EMAIL === 'true';
  const status = checkEmail ? 'unconfirmed' : 'registered';

  const result = await db.raw(`insert into users (login, password, salt, email, first_name, second_name, refresh, status, options)
    values (?, md5(? || ?), ?, ?, ?, ?, ?, ?, ?) returning id`,
  [login, password, salt, salt, email || null, firstName || null, secondName || null, '', status, options]);

  if (checkEmail) {
    const recover = uuidv4();
    await db.raw('insert into code (user_id, code, recover) values (?, ?, ?)', [result.rows[0].id, code, recover]);
    // mail.send({to: email, code, recover});
    ctx.body = result.rows;
  } else {
    ctx.body = await loginTool({
      ctx, login, password,
    });
  }
}

async function check(ctx) {
  const { id, code, recover } = ctx.request.body;
  const { db } = ctx.state;

  const expireIn = +process.env.LOGIN_CHECK_EMAIL_DELAY || 60;
  await db.raw('delete from code where time > NOW() - ?::INTERVAL', [`${expireIn} minutes`]);

  if (id) await db.raw('update code set attempts = attempts+1 where user_id=?', [id]);

  const data = recover ? await db.raw('select * from code where recover=? and attempts<=3', [recover])
    : await db.raw('select * from code where user_id=? and code=? and attempts<=3', [id, code]);

  if (!data.rowCount) return ctx.warning('WRONG_CODE');

  const { id: restoredId } = data.rows[0];
  await db.raw('update users set status=? where id = ? RETURNING *', ['registered', restoredId]);

  ctx.body = await loginTool({ id: restoredId });
}

async function restore(ctx) {
  const { login, email } = ctx.request.body;
  const { db } = ctx.state;
  const data = await db.raw('select * from users where (login=? or email=?) AND NOT deleted', [login, email]);

  if (!data.rowCount) {
    const recover = uuidv4();
    const { id } = data.rows[0];

    await db.raw('delete from code where user_id=?', [id]);
    await db.raw('insert into code (user_id, recover) values (?, ?)', [id, recover]);

    // mail.send({to, recover});
  }

  ctx.body = { ok: 1 };
}

async function setPassword(ctx) {
  const { code, password } = ctx.request.body;
  const { db } = ctx.state;
  const expireIn = +process.env.LOGIN_CHECK_EMAIL_DELAY || 60;

  const data = await db.raw('select * from code where recover=? and time > NOW() - ?::INTERVAL', [code, `${expireIn} minutes`]);

  if (!data.rowCount) return ctx.warning('WRONG_CODE');

  await db.raw('delete from code where recover=?', [code]);

  const salt = uuidv4();
  const { user_id } = data.rows[0];

  await db.raw('update users set password=md5(? || ?), salt=? where id=?', [password, salt, salt, user_id]);

  ctx.body = { ok: 1 };
}

module.exports = {
  loginHandler,
  register,
  check,
  restore,
  setPassword,
};
