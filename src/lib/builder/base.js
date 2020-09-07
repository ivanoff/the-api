const Knex = require('knex');
const winston = require('winston');
const jwt = require('jsonwebtoken');
const errors = require('./errors');
const Models = require('./models');
const controllers = require('./controllers');
const routes = require('./routes');

class Base {
  constructor(config) {
    this.config = config;

    const {
      TOKEN_SECRET, TOKEN_EXPIRE, LOG_LEVEL,
      DB_CLIENT, DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME,
      DB_CONNECTION,
    } = process.env;

    if (DB_CLIENT) {
      this.config.db = {
        client: DB_CLIENT,
        connection: {
          host: DB_HOST,
          port: DB_PORT,
          user: DB_USER,
          password: DB_PASSWORD,
          database: DB_NAME,
        },
      };
      if (DB_CONNECTION) this.config.db.connection = DB_CONNECTION;
    }

    if (LOG_LEVEL) this.config.logLevel = LOG_LEVEL;

    if (TOKEN_SECRET || TOKEN_EXPIRE) {
      this.config.token = { secret: TOKEN_SECRET, expire: TOKEN_EXPIRE };
    }

    this.error = errors;

    this.initLog();

    this.log.info('Waiting for database...');
    this.db = config.knex || Knex({ ...this.config.db, acquireConnectionTimeout: 10000 });

    this.freeAccess = {};

    this.models = new Models(this.db);
    this.routes = routes;
    this.controllers = controllers(this);

    this.override = {
      get: (...args) => this.overrideMethod('get', ...args),
      post: (...args) => this.overrideMethod('post', ...args),
      patch: (...args) => this.overrideMethod('patch', ...args),
      put: (...args) => this.overrideMethod('put', ...args),
      delete: (...args) => this.overrideMethod('delete', ...args),
    };
  }

  async destroy() {
    await this.db.destroy();
  }

  initLog() {
    if (this.config.silence) {
      this.log = {
        info: () => {},
        warn: () => {},
        debug: () => {},
        error: () => {},
      };
      return;
    }
    this.log = winston.createLogger({
      level: this.config.logLevel,
      format: winston.format.json(),
      transports: [
        new winston.transports.File({ filename: './log/error.log', level: 'error' }),
        new winston.transports.File({ filename: './log/combined.log' }),
      ],
    });

    this.log.add(new winston.transports.Console({
      format: winston.format.simple(),
    }));
  }

  logHandler(beginId = 0) {
    let id = beginId;
    return async (ctx, next) => {
      const {
        method, url, params, query, headers, body,
      } = ctx;

      id++;
      this.log.debug(`${id} [IN] ${method}, ${url}`);
      this.log.debug(`${id} [IN] ${JSON.stringify([
        { params, query, body }, { headers },
      ])}`);

      await next();

      this.log.debug(`${id} [OUT] ${ctx.response}`);
    };
  }

  async errorHandler(ctx, next) {
    try {
      await next();
      if (ctx.response.message === 'Not Found') throw { METHOD_NOT_FOUND: `Cannot ${ctx.request.method} ${ctx.request.url}` };
    } catch (err) {
      let stack;
      let developerMessage;
      let error = ctx.error[err] || err.message || err;

      const errKeys = Object.keys(error);
      if (errKeys.length === 1 && ctx.error[errKeys[0]]) {
        [[error, developerMessage]] = Object.entries(error);
      }

      let e = { ...error, name: err };

      if (ctx.error[error]) {
        e = {
          ...ctx.error[error], name: error, developerMessage, stack,
        };
      } else if (err.stack) {
        e = {
          name: err.toString(), developerMessage: err.message, stack: err.stack,
        };
      } else if (typeof error === 'string') e = { error };

      this.log.error(e);

      ctx.status = e.status || 520;
      ctx.body = e;
    }
  }

  security(openMethods, denyMethods = []) {
    return async (ctx, next) => {
      let currentUser;
      const token = ctx.request.headers['x-access-token'] || ctx.request.query.token || ctx.request.body.token;
      const { secret } = ctx.config && ctx.config.token ? ctx.config.token : {};

      if (token && secret) {
        delete ctx.request.query.token;
        delete ctx.request.body.token;

        try {
          currentUser = jwt.verify(token, secret);
        } catch (err) {
          throw err.name === 'TokenExpiredError' ? { TOKEN_EXPIRED: err } : { BAD_TOKEN: err };
        }

        const { login, group } = ctx.params;
        if (login && login !== currentUser.login) throw { ACCESS_DENIED: 'Login owner error' };
        if (group && group !== currentUser.group) throw { ACCESS_DENIED: 'Group owner error' };
      }

      const methods = [].concat(openMethods);
      const accessGranted = !this.config.token || methods.includes('*') || methods.includes(ctx.method);

      const methodsDenied = [].concat(denyMethods);
      const accessDenied = !accessGranted || methodsDenied.includes(ctx.method);

      if (accessDenied && !currentUser) throw 'ACCESS_DENIED';

      await next();
    };
  }

  // override defined methods
  overrideMethod(method, path, func) {
    for (let i = 0; i < this.router.stack.length; i++) {
      const s = this.router.stack[i];
      if (s.path === path && s.methods.includes(method.toUpperCase())) {
        s.stack[0] = func;
      }
    }
  }
}

module.exports = Base;
