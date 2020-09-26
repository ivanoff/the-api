const simpleLog = require('./simple');
const { name, version } = require('../../../package.json');

module.exports = async (ctx, next) => {
  const id = Math.random().toString(36).substring(2, 10);
  const timeBegin = new Date();

  ctx.state = {
    ...ctx.state, id, timeBegin, name, version,
  };

  ctx.state.log = simpleLog(ctx);

  const params = await ctx.params;
  const { query, body: bodyOrigin } = ctx.request;

  const body = { ...bodyOrigin };
  if (body.password) body.password = '<hidden>';

  const headers = { ...ctx.headers };
  if (headers.authorization) headers.authorization = '<hidden>';

  ctx.state.log('start', {
    params, query, body, headers,
  });

  await next();

  const result = { ...ctx.body };
  if (result.token) result.token = '<hidden>';
  if (result.refresh) result.refresh = '<hidden>';

  ctx.state.log(ctx.response, result, 'end');
};
