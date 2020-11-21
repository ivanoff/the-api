const endpoints = {};

module.exports = (ctx, next) => {
  ctx.state.requests.total++;

  if (ctx.url !== `${process.env.API_PREFIX || ''}/info`) return next();

  const {
    startTime, requestTime: currentTime, name, version, requests,
  } = ctx.state;

  const uptime = Math.floor((currentTime.getTime() - startTime.getTime()) / 1000);

  ctx.body = {
    currentTime, name, version, uptime, requests, endpoints,
  };
};

module.exports.endpointsToShow = (...routes) => {
  for (const { stack } of routes.filter(Boolean)) {
    for (const { methods, path } of stack) {
      endpoints[`${path}`] = [].concat(endpoints[`${path}`] || [], methods);
    }
  }
};

module.exports.examples = {
  'curl localhost:8877/info': {
    currentTime: '2020-08-07T19:48:57.660Z', name: 'the-api', version: '0.1.0', uptime: 1, requests: { total: 1 }, endpoints: { '/test': ['HEAD', 'GET'] },
  },
};
