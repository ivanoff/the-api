const Koa = require('koa');
const Router = require('@koa/router');
const bodyParser = require('koa-bodyparser');
const knex = require('knex');
const { FsMigrations } = require('knex/lib/migrate/sources/fs-migrations');
const extensions = require('./lib/extensions');
const routes = require('./lib/routes');

require('dotenv').config();

const { log } = console;
let intervalDbCheck;

class MainAPI {
  constructor({ port } = {}) {
    this.port = port || process.env.PORT;
    this.app = new Koa();
    this.app.use(bodyParser());
    // eslint-disable-next-line no-console
    this.app.on('error', console.error);
    this.router = () => new Router();
    this.routes = routes;
    this.extensions = extensions;
    this.log = (...toLog) => {
      for (const line of toLog) {
        log(`[${(new Date()).toISOString()}] ${line}`);
      }
    };

    const {
      POSTGRES_HOST: host, POSTGRES_USER: user, POSTGRES_PASSWORD: password, POSTGRES_DB: database,
    } = process.env;

    this.db = knex({
      client: 'pg',
      connection: {
        host, user, password, database,
      },
    });


  }

  up(flow = []) {
    const startTime = new Date();
    const requests = { total: 0 };

    const initServer = () => {
      const routeErrors = flow.reduce((acc, item) => ({ ...acc, ...item.errors }), {});

      const examples = flow.reduce((acc, item) => acc.concat(item.examples), []).filter(Boolean);

      this.app.use(async (ctx, next) => {
        ctx.state = {
          ...ctx.state, startTime, requests, examples, db: this.db, routeErrors, log: this.log,
        };
        await next();
      });

      const migrationDirs = flow.map((item) => item.migration).filter(Boolean);
      if (migrationDirs.length) {
        this.db.migrate.latest({ migrationSource: new FsMigrations(migrationDirs, false) });
      }

      flow.map((item) => this.app.use(typeof item.routes === 'function' ? item.routes() : item));

      this.app.listen(this.port);
      this.log(`Started on port ${this.port}`);
    };

    const checkDb = () => {
      this.db.raw('select 1+1 as result')
        .then(() => {
          clearInterval(intervalDbCheck);
          this.log('DB connected');
          initServer();
        })
        .catch((err) => this.log('DB connection error:', err, 'waiting for 5 seconds...'));
    };

    intervalDbCheck = setInterval(checkDb, 5000);
    checkDb();
  }
}

module.exports = MainAPI;
