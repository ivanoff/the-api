module.exports = (ctx) => (...toLog) => {
  if (process.env.NODE_ENV === 'test') return;

  const {
    state: {
      id, requestTime, method, url,
    },
  } = ctx;
  const date = new Date();
  const ms = date - requestTime;
  for (const l of toLog) {
    const logData = typeof l === 'object' ? JSON.stringify(l) : l;
    // eslint-disable-next-line no-console
    console.log(`[${date.toISOString()}] [${id}] [${method}] [${url}] [${ms}]: ${logData}`);
  }
};
