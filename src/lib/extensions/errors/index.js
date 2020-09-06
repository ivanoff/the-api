const errors = require('./list');

const url = 'https://server/api/errors';

module.exports = async (ctx, next) => {
  let isWarning = false;
  try {
    ctx.warning = (wrn) => {
      isWarning = true;
      throw new Error(wrn);
    };
    await next();
    if (ctx.status === 404 && !ctx.body) throw new Error('API_METHOD_NOT_FOUND');
  } catch (errorObj) {
console.log(isWarning, errorObj)
    const { message: codeName, stack } = errorObj;
console.log(isWarning, errorObj.message)
    const { name, version, routeErrors } = ctx.state;

    const errorListed = routeErrors[codeName] || errors[codeName];
    const error = errorListed || errors.DEFAULT_ERROR;
    if (errorListed && !error.url) error.url = `${url}#${codeName}`;

    error.developerMessage = {
      name, version, codeName, stack,
    };
    if (!isWarning) ctx.state.log(error);

    const { code, name: errorName, description } = error;
    ctx.status = error.status || 500;
    ctx.body = { code, name: errorName, description };

    // in case we want to delegate to the regular app
    // ctx.app.emit('error', error, ctx);
  }
};
