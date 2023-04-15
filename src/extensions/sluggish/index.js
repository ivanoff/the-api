const os = require('os');
const { WebClient } = require('@slack/web-api');

const {
  NODE_ENV: env,
  SLUGGISH_MAX_LIMIT_MS: maxLimitMs,
  SLUGGISH_SLACK_TOKEN: slackToken,
  SLUGGISH_SLACK_CHANNEL: slackChannel,
} = process.env;

module.exports = async (ctx, next) => {
  await next();

  const {
    method,
    url,
    headers,
    params,
    request: {
      ip, query, files, body: bodyOrigin,
    },
    state: {
      id, requestTime, name, version, log,
    },
  } = ctx;

  const date = new Date();
  const ms = date - requestTime;

  if (!maxLimitMs || +ms < +maxLimitMs) return;

  const system = ['loadavg', 'cpus', 'totalmem', 'freemem'].reduce((acc, key) => {
    acc[`${key}`] = os[`${key}`]();
    return acc;
  }, {});

  const body = { ...bodyOrigin };
  if (body.password) body.password = '<hidden>';
  if (headers.authorization) headers.authorization = '<hidden>';

  const logData = {
    env, name, version, ip, params, query, headers, body, files, system,
  };

  const text = `[${date.toISOString()}] [${id}] [${method}] [${url}] [${ms}] [SLUGGISH]
\`\`\`
${JSON.stringify(logData, null, '  ')}
\`\`\``;

  log(text);

  if (slackToken) {
    const web = new WebClient(slackToken);

    const result = await web.chat.postMessage({ text, channel: slackChannel });

    log(`[SLUGGISH] slack message sent ${result.ts}`);
  }
};
