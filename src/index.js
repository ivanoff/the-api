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
        const noStringify = line instanceof Error || typeof line !== 'object';
        const l = noStringify ? line : JSON.stringify(line);
        // eslint-disable-next-line no-console
        console.log(`[${(new Date()).toISOString()}]`, l);
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
      // skip in case of oauth2 autorization
      if (ctx.path === '/oauth2/me') return next();

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
        await this.dbWrite.migrate.latest({ migrationSource });
      } catch (err) {
        this.log(err);
      }
    }
  }

  async crud(params = {}) {
    await this.waitDb;
    const t = `${params.schema || 'public'}.${params.table}`;
    const tableInfo = params.table && this.tablesInfo?.[`${t}`];
    return crud({ ...(tableInfo && { tableInfo }), ...params });
  }

  async koaKnexHelper(params = {}) {
    await this.waitDb;
    const t = `${params.schema || 'public'}.${params.table}`;
    const tableInfo = params.table && this.tablesInfo?.[`${t}`];
    return new KoaKnexHelper({ ...(tableInfo && { tableInfo }), ...params });
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
    const flowArray = flowSynced.reduce((acc, cur) => {
      if (!cur) return acc;
      const fns = [].concat(cur).map((c) => (c.toString().match(/^(async )?\(api\) =>/) ? c(this) : c));
      return acc.concat(...fns);
    }, []).filter(Boolean);
    const flow = await Promise.all(flowArray);

    const routeErrors = flow.reduce((acc, item) => ({ ...acc, ...item.errors }), {});

    const examples = flow.reduce((acc, item) => acc.concat(item.examples), []).filter(Boolean);

    const limits = flow.reduce((acc, item) => ({ ...acc, ...item.limits }), {});
    this.extensions.limits.setLimits(limits);

    const stack = flow.filter((item) => typeof item.routes === 'function')
      .map((item) => item.routes().router.stack).reduce((acc, val) => acc.concat(val), [])
      .map(({ methods, path, regexp }) => ({ methods, path, regexp }));

    await this.migrations(flow);
    this.tablesInfo = { ...await getTablesInfo(this.dbWrite) };

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

    let userAccess = {};
    try {
      const accessRaw = await this.db('user_access').select();
      userAccess = accessRaw.reduce((cur, acc) => ({ ...cur, [acc.name]: acc.statuses }), {});
    } catch (err) {
      this.log(err);
    }

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
      DB_HOST: host,
      DB_PORT: dbPort,
      DB_USER: user,
      DB_PASSWORD: password,
      DB_NAME: database,
      DB_SCHEMA: schema,
      DB_FILENAME: filename,
      DB_WRITE_CLIENT: clientWrite,
      DB_WRITE_HOST: hostWrite,
      DB_WRITE_PORT: dbPortWrite,
      DB_WRITE_USER: userWrite,
      DB_WRITE_PASSWORD: passwordWrite,
      DB_WRITE_NAME: databaseWrite,
      DB_WRITE_SCHEMA: schemaWrite,
      DB_WRITE_FILENAME: filenameWrite,
    } = process.env;

    const connection = client === 'sqlite3' && filename ? { filename } : {
      host, user, password, database, port: dbPort, ...(schema && { schema }),
    };

    const connectionWrite = clientWrite === 'sqlite3' && filenameWrite ? { filename: filenameWrite } : {
      host: hostWrite,
      user: userWrite,
      password: passwordWrite,
      database: databaseWrite,
      port: dbPortWrite,
      ...(schemaWrite && { schema: schemaWrite }),
    };

    const knexDefaultParams = { client: 'sqlite3', connection: ':memory:' };
    const knexParams = client ? { client, connection } : knexDefaultParams;
    this.db = knex({ ...knexParams, useNullAsDefault: true });
    this.dbWrite = !hostWrite ? this.db : knex({
      client: clientWrite, connection: connectionWrite, useNullAsDefault: true,
    });
    this.waitDb = this.connectDb();

    await this.waitDb;
    const flow2 = typeof flow === 'function' ? Object.values(flow(this)) : flow;
    await this.initServer(Array.isArray(flow2) ? flow2 : Object.values(flow2));
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
      await this.dbWrite.raw('select 1+1 as result');
      clearInterval(this.intervalDbCheck);
      this.log('DB connected');

      const migrationSource = new FsMigrations(this.migrationDirs, false);
      await this.dbWrite.migrate.latest({ migrationSource });
      this.log('Migration done');

      const similarityThreshold = process.env.DB_TRGM_SIMILARITY_THRESHOLD || 0.1;
      await this.db.raw(`SET pg_trgm.similarity_threshold = ${+similarityThreshold}`);
      await this.dbWrite.raw(`SET pg_trgm.similarity_threshold = ${+similarityThreshold}`);

      this.tablesInfo = { ...await getTablesInfo(this.dbWrite) };
      this.log(`Tables found: ${Object.keys(this.tablesInfo)}`);
    } catch (err) {
      this.log('DB connection error:', err, 'waiting for 5 seconds...');
    }
  }

  async down() {
    if (this.connection) await this.connection.close();
    if (this.db) await this.db.destroy();
    if (this.dbWrite) await this.dbWrite.destroy();
    this.extensions.limits.destructor();
    for (const cj of this.cronJobs) cj.stop();

    this.log('Stopped');
  }
}

module.exports = TheAPI;
