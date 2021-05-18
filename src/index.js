const Koa = require('koa');
const Router = require('@koa/router');
const bodyParser = require('koa-bodyparser');
const knex = require('knex');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { FsMigrations } = require('knex/lib/migrations/migrate/sources/fs-migrations');
const extensions = require('./extensions');
const routes = require('./routes');
const errorsList = require('./extensions/errors/list');
const { name, version } = require('../package.json');

require('dotenv').config();

let intervalDbCheck;

class TheAPI {
  constructor({ port } = {}) {
    this.port = port || process.env.PORT || 8877;
    this.app = new Koa();
    this.app.use(bodyParser());
    // eslint-disable-next-line no-console
    this.app.on('error', console.error);
    this.router = () => new Router();
    this.routes = routes;
    this.extensions = extensions;
    this.log = (...toLog) => {
      if (process.env.NODE_ENV === 'test') return;
      for (const line of toLog) {
        // eslint-disable-next-line no-console
        console.log(`[${(new Date()).toISOString()}] ${line}`);
      }
    };
    this.log(`${name} v${version}`);

    const knexDefaultParams = { client: 'sqlite3', connection: ':memory:' };

    const {
      DB_CLIENT: client,
      DB_HOST: host, DB_USER: user, DB_PASSWORD: password, DB_NAME: database,
      DB_FILENAME: filename,
    } = process.env;

    const connection = client === 'sqlite3' && filename ? { filename } : {
      host, user, password, database,
    };

    const knexParams = client ? { client, connection } : knexDefaultParams;
    this.db = knex({ ...knexParams, useNullAsDefault: true });
  }

  // generate new random JWT_SECRET
  generateJwtSecret(n = 3) {
    this.log('New JWT_SECRET generated');
    return [...Array(n < 1 ? 1 : n)].map(() => uuidv4()).join(':');
  }

  async up(flow = []) {
    const startTime = new Date();
    const requests = { total: 0 };

    const initServer = async () => {
      const routeErrors = flow.reduce((acc, item) => ({ ...acc, ...item.errors }), {});

      const examples = flow.reduce((acc, item) => acc.concat(item.examples), []).filter(Boolean);

      const limits = flow.reduce((acc, item) => ({ ...acc, ...item.limits }), {});
      this.extensions.limits.setLimits(limits);

      const stack = flow.filter((item) => typeof item.routes === 'function')
        .map((item) => item.routes().router.stack).reduce((acc, val) => acc.concat(val), [])
        .map(({ methods, path, regexp }) => ({ methods, path, regexp }));

      const jwtSecret = process.env.JWT_SECRET || this.generateJwtSecret();

      this.app.use(async (ctx, next) => {
        const { authorization } = ctx.headers;
        if (!authorization) return next();

        this.log('Check token');
        const token = authorization.replace(/^bearer\s+/i, '');

        try {
          ctx.state.token = await jwt.verify(token, jwtSecret);
          await next();
        } catch (err) {
          const isExpired = err.toString().match(/jwt expired/);
          ctx.body = isExpired ? errorsList.TOKEN_EXPIRED : errorsList.TOKEN_INVALID;
          ctx.status = ctx.body.status;
        }
      });

      this.app.use(async (ctx, next) => {
        const { db } = this;
        const { log } = this;
        const requestTime = new Date();

        ctx.state = {
          ...ctx.state,
          startTime,
          requestTime,
          requests,
          examples,
          db,
          routeErrors,
          log,
          stack,
          jwtSecret,
        };
        ctx.warning = this.log;
        await next();
      });

      const migrationDirs = flow.map((item) => item.migration).filter(Boolean);
      if (migrationDirs.length) {
        try {
          await this.db.migrate.latest({ migrationSource: new FsMigrations(migrationDirs, false) });
        } catch (err) {
          this.log(err);
        }
      }

      if (process.env.API_PREFIX) {
        flow.map((item) => item.prefix && item.prefix(process.env.API_PREFIX));
      }

      flow.map((item) => this.app.use(typeof item.routes === 'function' ? item.routes() : item));

      this.connection = await this.app.listen(this.port);
      this.log(`Started on port ${this.port}`);
    };

    const checkDb = async () => {
      try {
        await this.db.raw('select 1+1 as result');
        clearInterval(intervalDbCheck);
        this.log('DB connected');
        await initServer();
      } catch (err) {
        this.log('DB connection error:', err, 'waiting for 5 seconds...');
      }
    };

    intervalDbCheck = setInterval(checkDb, 5000);
    await checkDb();
  }

  async down() {
    if (this.connection) await this.connection.close();
    await this.db.destroy();
    this.extensions.limits.destructor();
    this.log('Stopped');
  }
}

module.exports = TheAPI;
