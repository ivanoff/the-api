const redis = {
  stat: {},
  deny: {},
  access: {},
};

const limits = {};

module.exports = async (ctx, next) => {
  ctx.state.log('Check limits');

  const { authorization = '' } = ctx.headers;
  const token = authorization.replace(/^bearer\s+/i, '');

  if (!redis.stat[`${token}`]) redis.stat[`${token}`] = { total: 0 };

  const stat = redis.stat[`${token}`];
  const tokenLimits = limits[`${token}`] || {};
  const whiteListed = redis.access[`${token}`];

  if (ctx.path === '/stats') {
    ctx.body = { whiteListed, stat, tokenLimits };
    return;
  }

  //  if (!whiteListed) throw new Error('NOT_IN_WHITE_LIST');

  await next();

  const { _matchedRoute: route } = ctx;
  // eslint-disable-next-line no-underscore-dangle

  if (!stat[`${route}`]) stat[`${route}`] = 0;

  // total expired
  if (stat.total >= tokenLimits.total) {
    throw new Error('LIMIT_EXCEEDED');
  }

  // route expired
  if (tokenLimits[`${route}`] && stat[`${route}`] >= tokenLimits[`${route}`]) {
    const denyObj = redis.deny[`${token}`];
    redis.deny[`${token}`] = { [`${token}`]: true, ...denyObj };
    throw new Error('LIMIT_EXCEEDED');
  }

  stat.total++;
  stat[`${route}`]++;

  ctx.state.log(`Access was garanted for ${route}`);
};

module.exports.endpointsToLimit = (token, route, limit) => {
  if (!limits[`${token}`]) limits[`${token}`] = {};
  limits[`${token}`][`${route}`] = limit;
};
