const crypto = require('crypto');

const redis = {};

let timeout = 5000;

module.exports = async (ctx, next) => {
  ctx.state.log('Check cache');

  const { method, url, request } = ctx;
  const params = JSON.stringify(await ctx.params);
  const query = JSON.stringify(request.query);

  const md5sum = crypto.createHash('md5').update(method + url + params + query);
  const key = md5sum.digest('hex');

  if (redis[`${key}`]) {
    ctx.state.log(`Get data from cache by key ${key}`);
    ctx.body = redis[`${key}`];
  } else {
    await next();
    ctx.state.log('Store data in cache for 5 second');
    redis[`${key}`] = ctx.body;
    ((eraseKey) => setTimeout(() => delete redis[`${eraseKey}`], timeout))(key);
  }
};

module.exports.cacheTimeout = (ms) => { timeout = ms; };
