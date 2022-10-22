const errors = require('./list');

const url = 'https://server/api/errors';

module.exports = async (ctx, next) => {
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

    ctx.state.log(error);
  }
};
