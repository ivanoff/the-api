const Sentry = require('@sentry/node');
const { WebClient } = require('@slack/web-api');
const errors = require('./list');

const url = 'https://server/api/errors';

const {
  ERRORS_SENTRY_DSN: dsn,
  ERRORS_SLACK_TOKEN: slackToken,
  ERRORS_SLACK_CHANNEL: slackChannel,
} = process.env;

const hasSentry = !!dsn;

if (hasSentry) {
  Sentry.init({
    dsn,
    tracesSampleRate: 1.0,
  });
}

module.exports = async (ctx, next) => {
  const sentryTransaction = hasSentry && Sentry.startTransaction({
    op: 'request',
    name: ctx.url,
  });

  try {
    ctx.throw = (err, ...arr) => {
      ctx.state.additionalErrors = arr;
      throw new Error(err);
    };

    await next();

    if (ctx.status === 404 && !ctx.body) throw new Error('API_METHOD_NOT_FOUND');
  } catch (errorObj) {
    const { message: codeName, stack } = errorObj;
    const { name, version, routeErrors } = ctx.state;

    const errorListed = routeErrors[`${codeName}`] || errors[`${codeName}`];
    const error = errorListed || errors.DEFAULT_ERROR;
    if (errorListed && !error.url) error.url = `${url}#${codeName}`;
    if (ctx.state.additionalErrors?.length) error.addition = ctx.state.additionalErrors;

    error.developerMessage = {
      name, version, codeName, stack,
    };

    const {
      code, name: errorName, description, addition,
    } = error;
    ctx.status = error.status || 500;
    ctx.body = process.env.NODE_ENV !== 'production' ? error : {
      code, name: errorName, description, addition,
    };

    ctx.body.error = true;

    ctx.state.log(error);

    if (slackToken && ctx.status === 500) {
      const web = new WebClient(slackToken);
      await web.chat.postMessage({ text: JSON.stringify(error, null, '  '), channel: slackChannel });
    }

    if (hasSentry) Sentry.captureException(errorObj);
  } finally {
    if (sentryTransaction) sentryTransaction.finish();
  }
};
