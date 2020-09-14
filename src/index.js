const Koa = require('koa');
const Router = require('@koa/router');
const bodyParser = require('koa-bodyparser');
const knex = require('knex');
const { v4: uuidv4 } = require('uuid');
const { FsMigrations } = require('knex/lib/migrate/sources/fs-migrations');
const extensions = require('./extensions');
const routes = require('./routes');

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
      const jwtToken = process.env.JWT_SECRET || this.generateJwtSecret();

      this.app.use(async (ctx, next) => {
        const { db } = this;
        const { log } = this;
        ctx.state = {
          ...ctx.state, startTime, requests, examples, db, routeErrors, jwtToken, log,
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
    await this.connection.close();
    await this.db.destroy();
    this.log('Stopped');
  }
}

module.exports = TheAPI;
