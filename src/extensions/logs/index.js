const simpleLog = require('./simple');

const {
  npm_package_name: name,
  npm_package_version: version,
} = process.env;

module.exports = async (ctx, next) => {
  const { method, url: u } = ctx;
  const url = u.replace(/\?.*$/, '');
  const id = Math.random().toString(36).substring(2, 10);

  ctx.state = {
    ...ctx.state, id, name, version, method, url,
  };

  ctx.state.log = simpleLog(ctx);

  const params = await ctx.params;

  const {
    ip, query, files, body: bodyOrigin,
  } = ctx.request;

  const { state: { token } } = ctx;
  const user = token && {
    id: token.id,
    login: token.login,
  };

  const body = { ...bodyOrigin };
  if (body.password) body.password = '<hidden>';

  const headers = { ...ctx.headers };
  if (headers.authorization) headers.authorization = '<hidden>';

  ctx.state.log('start', {
    ip, user, params, query, headers, body, files,
  });

  await next();

  const result = { ...ctx.body };
  if (result.token) result.token = '<hidden>';
  if (result.refresh) result.refresh = '<hidden>';

  const r = process.env.LOGS_SHOW_RESPONSE_SIZE_ONLY ? `${JSON.stringify(result).length}b` : result;

  ctx.state.log(ctx.response, r, 'end');
};
