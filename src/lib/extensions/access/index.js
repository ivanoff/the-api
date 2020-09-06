const redis = {
  stat: {},
  deny: {},
  access: {
    token123: true,
  },
};

const limits = {
  token123: {
    total: 10,
    '/channels/:channel': 5,
  },
};

module.exports = async (ctx, next) => {
  ctx.state.log('Check access');

  const { TOKEN_IN_HEADER } = ctx.query;

  if (!redis.stat[TOKEN_IN_HEADER]) redis.stat[TOKEN_IN_HEADER] = { total: 0 };

  const stat = redis.stat[TOKEN_IN_HEADER];
  const tokenLimits = limits[TOKEN_IN_HEADER] || {};
  const whiteListed = redis.access[TOKEN_IN_HEADER];

  if (ctx.path === '/stats') {
    ctx.body = { whiteListed, stat, tokenLimits };
    return;
  }

  //  if (!whiteListed) throw new Error('NOT_IN_WHITE_LIST');

  await next();

  // eslint-disable-next-line no-underscore-dangle
  const route = ctx._matchedRoute;

  if (!stat[route]) stat[route] = 0;

  // total expired
  if (stat.total >= tokenLimits.total) {
    redis.access[TOKEN_IN_HEADER] = false;
    //    throw new Error('LIMIT_EXCEEDED');
  }
  // route expired
  if (tokenLimits[route] && stat[route] >= tokenLimits[route]) {
    const denyObj = redis.deny[TOKEN_IN_HEADER];
    redis.deny[TOKEN_IN_HEADER] = { [route]: true, ...denyObj };
    throw new Error('LIMIT_EXCEEDED');
  }

  stat.total++;
  stat[route]++;

  ctx.state.log(`Access was garanted for ${route}`);
};
