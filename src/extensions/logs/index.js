const simpleLog = require('./simple');

const {
  npm_package_name: name,
  npm_package_version: version,
} = process.env;

module.exports = async (ctx, next) => {
  const id = Math.random().toString(36).substring(2, 10);

  ctx.state = {
    ...ctx.state, id, name, version,
  };

  ctx.state.log = simpleLog(ctx);

  const params = await ctx.params;

  const {
    ip, query, files, body: bodyOrigin,
  } = ctx.request;

  const body = { ...bodyOrigin };
  if (body.password) body.password = '<hidden>';

  const headers = { ...ctx.headers };
  if (headers.authorization) headers.authorization = '<hidden>';

  ctx.state.log('start', {
    ip, params, query, headers, body, files,
  });

  await next();

  const result = { ...ctx.body };
  if (result.token) result.token = '<hidden>';
  if (result.refresh) result.refresh = '<hidden>';

  ctx.state.log(ctx.response, result, 'end');
};
