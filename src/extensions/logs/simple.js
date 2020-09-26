module.exports = (ctx) => (...toLog) => {
  if (process.env.NODE_ENV === 'test') return;

  const { method, url, state: { id, timeBegin } } = ctx;
  const date = new Date();
  const ms = date - timeBegin;
  for (const l of toLog) {
    const logData = typeof l === 'object' ? JSON.stringify(l) : l;
    const u = url.replace(/\?.*$/, '');
    // eslint-disable-next-line no-console
    console.log(`[${date.toISOString()}] [${id}] [${method}] [${u}] [${ms}]: ${logData}`);
  }
};
