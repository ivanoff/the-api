const jwt = require('jsonwebtoken');

module.exports = async (ctx, next) => {
  ctx.state.log('Check token');

  const { authorization = '' } = ctx.headers;
  const token = authorization.replace(/^bearer\s+/i, '');

  if (!token) throw new Error('NO_TOKEN');

  try {
    const { id } = await jwt.verify(token, process.env.JWT_SIGN);
    ctx.state.user_id = id;
  } catch (err) {
    if (err.toString().match(/jwt expired/)) throw new Error('TOKEN_EXPIRED');
    throw new Error('TOKEN_INVALID');
  }

  await next();
};
