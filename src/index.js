const Koa = require('koa');
const Router = require('@koa/router');
const bodyParser = require('koa-bodyparser');
const formidable = require('koa2-formidable');
const knex = require('knex');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { FsMigrations } = require('knex/lib/migrations/migrate/sources/fs-migrations');
const extensions = require('./extensions');
const routes = require('./routes');
const errorsList = require('./extensions/errors/list');
const { name, version } = require('../package.json');

require('dotenv').config();

class TheAPI {
  constructor({ port } = {}) {
    this.port = port || process.env.PORT || 8877;
    this.app = new Koa();
    this.app.use(formidable({ multiples: true }));
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

  checkToken(jwtSecret) {
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
  }

  async migrations(flow) {
    const migrationDirs = flow.map((item) => item.migration).filter(Boolean);
    if (migrationDirs.length) {
      try {
        await this.db.migrate.latest({ migrationSource: new FsMigrations(migrationDirs, false) });
      } catch (err) {
        this.log(err);
      }
    }
  }

  async tablesInfo() {
    let query;
    let bindings = [this.db.client.database()];

    switch (this.db.client.constructor.name) {
      case 'Client_MSSQL':
        query = 'SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\' AND table_catalog = ?';
        break;
      case 'Client_MySQL':
      case 'Client_MySQL2':
        query = 'SELECT table_name FROM information_schema.tables WHERE table_schema = ?';
        break;
      case 'Client_Oracle':
      case 'Client_Oracledb':
        query = 'SELECT table_name FROM user_tables';
        bindings = undefined;
        break;
      case 'Client_PG':
        query = 'SELECT table_name FROM information_schema.tables WHERE table_schema = current_schema() AND table_catalog = ?';
        break;
      case 'Client_SQLite3':
        query = "SELECT name AS table_name FROM sqlite_master WHERE type='table'";
        bindings = undefined;
        break;
      default:
        this.log('Unknown database');
    }

    const tables = await this.db.raw(query, bindings);
    const result = {};
    await Promise.all(tables.map(async ({ table_name }) => {
      result[`${table_name}`] = await this.db(table_name).columnInfo();
    }));
    return result;
  }

  async checkDbAndRun(flow) {
    try {
      await this.db.raw('select 1+1 as result');
      clearInterval(this.intervalDbCheck);
      this.log('DB connected');
      await this.initServer(flow);
    } catch (err) {
      this.log('DB connection error:', err, 'waiting for 5 seconds...');
    }
  }

  async initServer(flow) {
    const startTime = new Date();
    const requests = { total: 0 };

    const routeErrors = flow.reduce((acc, item) => ({ ...acc, ...item.errors }), {});

    const examples = flow.reduce((acc, item) => acc.concat(item.examples), []).filter(Boolean);

    const limits = flow.reduce((acc, item) => ({ ...acc, ...item.limits }), {});
    this.extensions.limits.setLimits(limits);

    const stack = flow.filter((item) => typeof item.routes === 'function')
      .map((item) => item.routes().router.stack).reduce((acc, val) => acc.concat(val), [])
      .map(({ methods, path, regexp }) => ({ methods, path, regexp }));

    const jwtSecret = process.env.JWT_SECRET || this.generateJwtSecret();
    this.checkToken(jwtSecret);

    await this.migrations(flow);
    const tablesInfo = await this.tablesInfo();

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
        tablesInfo,
        routeErrors,
        log,
        stack,
        jwtSecret,
      };
      ctx.warning = this.log;
      await next();
    });

    if (process.env.API_PREFIX) {
      flow.map((item) => item.prefix && item.prefix(process.env.API_PREFIX));
    }

    flow.map((item) => this.app.use(typeof item.routes === 'function' ? item.routes() : item));

    this.connection = await this.app.listen(this.port);
    this.log(`Started on port ${this.port}`);
  }

  async up(flow = []) {
    this.intervalDbCheck = setInterval(async () => this.checkDbAndRun(flow), 5000);
    await this.checkDbAndRun(flow);
  }

  async down() {
    if (this.connection) await this.connection.close();
    await this.db.destroy();
    this.extensions.limits.destructor();
    this.log('Stopped');
  }
}

module.exports = TheAPI;
