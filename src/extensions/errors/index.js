const errors = require('./list');

const url = 'https://server/api/errors';

module.exports = async (ctx, next) => {
  try {
    ctx.throw = (err) => {
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

    error.developerMessage = {
      name, version, codeName, stack,
    };

    const { code, name: errorName, description } = error;
    ctx.status = error.status || 500;
    ctx.body = process.env.NODE_ENV === 'production' ? { code, name: errorName, description } : error;

    ctx.state.log(error);
  }
};
