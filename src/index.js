const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const formidable = require('koa2-formidable');
const passport = require('koa-passport');
const knex = require('knex');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { CronJob } = require('cron');
const { FsMigrations } = require('knex/lib/migrations/migrate/sources/fs-migrations');
const {
  Router, getSwaggerData, crud, getTablesInfo, KoaKnexHelper,
} = require('./lib');
const extensions = require('./extensions');
const routes = require('./routes');
const errorsList = require('./extensions/errors/list');

require('dotenv').config();

const {
  PORT,
  JWT_SECRET,
  SWAGGER_VERSION,
  SWAGGER_TITLE,
  SWAGGER_HOST,
  SWAGGER_BASEPATH,
  UPLOAD_MULTIPLY_DISABLED,
  npm_package_name: name,
  npm_package_version: version,
} = process.env;

class TheAPI {
  constructor({ port, migrationDirs = [] } = {}) {
    this.port = port || PORT || 8877;
    this.app = new Koa();
    this.passport = passport;
    if (!UPLOAD_MULTIPLY_DISABLED) {
      this.app.use(formidable({ multiples: true }));
    }
    this.app.use(bodyParser());
    this.app.use(this.passport.initialize());
    // eslint-disable-next-line no-console
    this.app.on('error', console.error);
    this.router = () => new Router();
    this.routes = routes;
    this.extensions = extensions;
    this.cronJobs = [];
    this.swaggerOptions = {
      version: SWAGGER_VERSION,
      title: SWAGGER_TITLE,
      host: SWAGGER_HOST,
      basePath: SWAGGER_BASEPATH,
    };
    this.log = (...toLog) => {
      for (const line of toLog) {
        const l = typeof line === 'object' ? JSON.stringify(line) : line;
        // eslint-disable-next-line no-console
        console.log(`[${(new Date()).toISOString()}] ${l}`);
      }
    };
    this.log(`${name} v${version}`);

    this.migrationDirs = [`${__dirname}/migrations`].concat(migrationDirs);
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
        const migrationSource = new FsMigrations(this.migrationDirs.concat(migrationDirs), false);
        await this.db.migrate.latest({ migrationSource });
      } catch (err) {
        this.log(err);
      }
    }
  }

  async crud(params = {}) {
    await this.waitDb;
    return crud({ tableInfo: this.tablesInfo && this.tablesInfo[`${params.table}`], ...params });
  }

  async koaKnexHelper(params = {}) {
    await this.waitDb;
    return new KoaKnexHelper({ tableInfo: this.tablesInfo && this.tablesInfo[`${params.table}`], ...params });
  }

  cron(jobs = {}) {
    for (const [jobName, { cronTime, job, timezone }] of Object.entries(jobs)) {
      if (typeof job !== 'function') continue;
      const { db, log } = this;

      const cj = new CronJob(
        cronTime,
        async () => {
          this.log(`[CRON] ${jobName} begin...`);
          try {
            await job({ db, log });
          } catch (error) {
            this.log(`[CRON] ${jobName} error`, error);
          }
          this.log(`[CRON] ${jobName} done`);
        },
        null,
        false,
        timezone,
      );

      cj.start();
      this.cronJobs.push(cj);
    }
  }

  async initServer(flowOrigin) {
    const startTime = new Date();
    const requests = { total: 0 };

    const jwtSecret = JWT_SECRET || this.generateJwtSecret();
    this.checkToken(jwtSecret);

    const flowSynced = await Promise.all(flowOrigin);
    const flowArray = flowSynced.reduce((acc, cur) => (acc.concat(cur)), []).filter(Boolean);
    const flow = await Promise.all(flowArray);

    const routeErrors = flow.reduce((acc, item) => ({ ...acc, ...item.errors }), {});

    const examples = flow.reduce((acc, item) => acc.concat(item.examples), []).filter(Boolean);

    const limits = flow.reduce((acc, item) => ({ ...acc, ...item.limits }), {});
    this.extensions.limits.setLimits(limits);

    const stack = flow.filter((item) => typeof item.routes === 'function')
      .map((item) => item.routes().router.stack).reduce((acc, val) => acc.concat(val), [])
      .map(({ methods, path, regexp }) => ({ methods, path, regexp }));

    await this.migrations(flow);
    this.tablesInfo = { ...await getTablesInfo(this.db) };

    if (this.swaggerOptions.version) {
      const swaggerData = getSwaggerData({
        flow,
        options: this.swaggerOptions,
        tablesInfo: this.tablesInfo,
      });
      const swaggerRoute = this.router().get('/swagger.yaml', (ctx) => {
        ctx.set('Access-Control-Allow-Origin', '*');
        ctx.set('Access-Control-Allow-Methods', 'GET');
        ctx.body = swaggerData;
      }).routes();
      this.app.use(swaggerRoute);
    }

    const accessRaw = await this.db('user_access').select();
    const userAccess = accessRaw.reduce((cur, acc) => ({ ...cur, [acc.name]: acc.statuses }), {});

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
        tablesInfo: this.tablesInfo,
        userAccess,
      };
      ctx.throw = this.log;
      await next();
    });

    if (process.env.API_PREFIX) {
      flow.map((item) => item.prefix && item.prefix(process.env.API_PREFIX));
    }

    const routesList = flow.map((item) => (typeof item.routes === 'function' ? item.routes() : typeof item === 'function' && item)).filter(Boolean);
    routesList.map((item) => this.app.use(item));

    this.connection = await this.app.listen(this.port);
    this.log(`Started on port ${this.port}`);
  }

  async up(flow = []) {
    const {
      DB_CLIENT: client,
      DB_HOST: host, DB_PORT: dbPort, DB_USER: user, DB_PASSWORD: password, DB_NAME: database,
      DB_FILENAME: filename,
    } = process.env;

    const connection = client === 'sqlite3' && filename ? { filename } : {
      host, user, password, database, port: dbPort,
    };

    const knexDefaultParams = { client: 'sqlite3', connection: ':memory:' };
    const knexParams = client ? { client, connection } : knexDefaultParams;
    this.db = knex({ ...knexParams, useNullAsDefault: true });
    this.waitDb = this.connectDb();

    await this.waitDb;
    await this.initServer(flow);
  }

  async connectDb() {
    return new Promise((resolve) => {
      this.intervalDbCheck = setInterval(async () => this.checkDb().then(resolve), 5000);
      this.checkDb().then(resolve);
    });
  }

  async checkDb() {
    try {
      await this.db.raw('select 1+1 as result');
      clearInterval(this.intervalDbCheck);
      this.log('DB connected');

      const migrationSource = new FsMigrations(this.migrationDirs, false);
      await this.db.migrate.latest({ migrationSource });
      this.log('Migration done');

      this.tablesInfo = { ...await getTablesInfo(this.db) };
      this.log(`Tables found: ${Object.keys(this.tablesInfo)}`);
    } catch (err) {
      this.log('DB connection error:', err, 'waiting for 5 seconds...');
    }
  }

  async down() {
    if (this.connection) await this.connection.close();
    if (this.db) await this.db.destroy();
    this.extensions.limits.destructor();
    for (const cj of this.cronJobs) cj.stop();

    this.log('Stopped');
  }
}

module.exports = TheAPI;
