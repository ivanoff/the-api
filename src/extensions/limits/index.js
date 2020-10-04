const redis = {
  stat: {},
  deny: {},
  access: {},
  minute: {},
  hour: {},
  day: {},
  total: {},
};

//setInterval(() => (redis.minute = {}), 1000 * 60);
//setInterval(() => (redis.hour = {}), 1000 * 60 * 60);
//setInterval(() => (redis.day = {}), 1000 * 60 * 60 * 24);

const limits = {};
let limitsData = {};

module.exports = async (ctx, next) => {
//  return next();
  const { url, method, ip } = ctx.request;
  const { stack, token } = ctx.state;
  const { id, user_id } = token || {};
  const key = user_id || id || ip;

  let stat = {}
  Object.keys(redis).map(type => (stat[type] = redis[type][key]));
  const total = redis.total[key] || 0;
  redis.total[key] = total + 1;

  if (ctx.path === '/stats') {
    ctx.body = { stat };
    return next();
  }

  ctx.state.log('Check limits');

  const { path } = stack.filter(({methods, regexp}) => url.match(regexp) && methods.includes(method)).shift() || {};

  const metodPath = `${method} ${path}`;
  if(!limitsData[path] && !limitsData[metodPath]) return next();

  const isForbidden = ['minute', 'hour', 'day'].map(type => {
    if(!redis[type][key]) redis[type][key] = {};

    const sss1 = redis[type][key][path] || 0;
    if(limitsData[path] && sss1 >= limitsData[path][type]) return true;
    redis[type][key][path] = sss1 + 1;

    const sss2 = redis[type][key][metodPath] || 0;
    if(limitsData[metodPath] && sss2 >= limitsData[metodPath][type]) return true;
    redis[type][key][metodPath] = sss2 + 1;
  }).find(item => !!item);

  if(isForbidden) throw new Error('LIMIT_EXCEEDED');

  ctx.state.log(`Access was garanted for ${metodPath}`);

  await next();

/*
//  redis.minutes[]
console.log('===============================');
console.log(path);
console.log('===============================');
console.log(limitsData)
console.log('===============================');
console.log(ctx.request)
console.log('===============================');
console.log(ctx.state.token)
console.log(ctx.request.ip)

  if (!redis.stat[`${key}`]) redis.stat[`${key}`] = { total: 0 };

  const stat = redis.stat[`${key}`];
  const tokenLimits = limits[`${key}`] || {};
  const whiteListed = redis.access[`${key}`];

  if (ctx.path === '/stats') {
    ctx.body = { whiteListed, stat, tokenLimits };
    return;
  }

  //  if (!whiteListed) throw new Error('NOT_IN_WHITE_LIST');

  await next();

  const { _matchedRoute: route } = ctx;
  // eslint-disable-next-line no-underscore-dangle
//console.log(route)
//console.log(route)
//console.log(route)
//console.log(ctx)
  if (!stat[`${route}`]) stat[`${route}`] = 0;

  // total expired
  if (stat.total >= tokenLimits.total) {
    throw new Error('LIMIT_EXCEEDED');
  }

  if (stat.total >= limitsData.total) {
    throw new Error('LIMIT_EXCEEDED');
  }

  // route expired
  if (tokenLimits[`${route}`] && stat[`${route}`] >= tokenLimits[`${route}`]) {
    const denyObj = redis.deny[`${key}`];
    redis.deny[`${key}`] = { [`${key}`]: true, ...denyObj };
    throw new Error('LIMIT_EXCEEDED');
  }

  stat.total++;
  stat[`${route}`]++;

  ctx.state.log(`Access was garanted for ${route}`);
*/
};

module.exports.setLimits = (a) => {
  limitsData = {...limitsData, ...a};
};