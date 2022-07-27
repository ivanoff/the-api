const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const formidable = require('koa2-formidable');
const knex = require('knex');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { FsMigrations } = require('knex/lib/migrations/migrate/sources/fs-migrations');
const Router = require('./lib/router');
const extensions = require('./extensions');
const routes = require('./routes');
const errorsList = require('./extensions/errors/list');
const { name, version } = require('../package.json');

require('dotenv').config();

class TheAPI {
  constructor({ port, swagger } = {}) {
    this.port = port || process.env.PORT || 8877;
    this.swaggerOptions = swagger;
    this.app = new Koa();
    if (!process.env.UPLOAD_MULTIPLY_DISABLED) {
      this.app.use(formidable({ multiples: true }));
    }
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
      DB_HOST: host, DB_PORT: dbPort, DB_USER: user, DB_PASSWORD: password, DB_NAME: database,
      DB_FILENAME: filename,
    } = process.env;

    const connection = client === 'sqlite3' && filename ? { filename } : {
      host, user, password, database, port: dbPort,
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
        query = 'SELECT table_name FROM information_schema.tables WHERE table_schema = current_schema()';
        bindings = undefined;
        break;
      case 'Client_SQLite3':
        query = "SELECT name AS table_name FROM sqlite_master WHERE type='table'";
        bindings = undefined;
        break;
      default:
        this.log('Unknown database');
    }

    const t = await this.db.raw(query, bindings);
    const tables = t.rows || t;

    let queryRef;

    switch (this.db.client.constructor.name) {
      case 'Client_MSSQL':
      case 'Client_MySQL':
      case 'Client_MySQL2':
      case 'Client_Oracle':
      case 'Client_Oracledb':
      case 'Client_SQLite3':
        queryRef = '';
        break;
      case 'Client_PG':
        queryRef = `SELECT
              tc.table_schema, 
              tc.constraint_name, 
              tc.table_name, 
              kcu.column_name, 
              ccu.table_schema AS foreign_table_schema,
              ccu.table_name AS foreign_table_name,
              ccu.column_name AS foreign_column_name 
          FROM 
              information_schema.table_constraints AS tc 
              JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema = kcu.table_schema
              JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
                AND ccu.table_schema = tc.table_schema
          WHERE tc.constraint_type = 'FOREIGN KEY'`;
        break;
      default:
        this.log('Unknown database');
    }

    const tRef = await this.db.raw(queryRef, bindings);
    const references = tRef.rows || tRef;

    const result = {};
    await Promise.all(tables.map(async ({ table_name }) => {
      if (this.db.client.constructor.name === 'Client_PG') {
        const columnInfo = await this.db.raw('select * from information_schema.columns where table_name = ? and table_schema = current_schema()', table_name);
        result[`${table_name}`] = columnInfo.rows.reduce((acc, cur) => ({ ...acc, [cur.column_name]: cur }), {});

        for (const key of Object.keys(result[`${table_name}`])) {
          result[`${table_name}`][`${key}`].references = references.find((item) => item.table_name === table_name && item.column_name === key);
        }
      } else {
        result[`${table_name}`] = await this.db(table_name).columnInfo();
      }
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
    const tablesInfo = { ...await this.tablesInfo() };

    if (this.swaggerOptions) {
      const { version: v = '0.0.1', title = 'API', host = '127.0.0.1:7788' } = this.swaggerOptions;

      const header = `swagger: "2.0"\ninfo:\n  version: "${v}"\n  title: "${title}"\nhost: "${host}"\nschemes:\n- http\n`;

      const swagger = flow.reduce((acc, item) => acc.concat(item.swagger), [])
        .filter(Boolean)
        .reduce((acc, cur) => {
          for (const [key, val] of Object.entries(cur)) {
            acc[`${key}`] = acc[`${key}`] ? { ...acc[`${key}`], ...val } : val;
          }
          return acc;
        }, {});

      let paths = 'paths:\n';

      for (const [po, r] of Object.entries(swagger)) {
        const p = po.replace(/:([^/]+)/g, '{$1}');
        const pathParameters = [...p.matchAll(/\{(.*?)\}/g)].map((item) => item[1]).filter(Boolean);

        paths += `  ${p}:\n`;
        for (const [r1, r2 = {}] of Object.entries(r)) {
          paths += `    ${r1}:\n`;
          if (r2.tag) paths += `      tags:\n      - "${r2.tag}"\n`;
          paths += `      summary: "${r2.summary || ''}"\n      description: ""\n`;
          if (!r1.match(/get|delete/)) paths += '      consumes:\n      - "application/json"\n';
          paths += '      produces:\n      - "application/json"\n';
          if (r2.required) {
            paths += '      parameters:\n';
            for (const requiredField of r2.required) {
              paths += `      - name: "${requiredField}"\n        in: "body"\n        required: true\n`;
            }
          }
          if (pathParameters.length) {
            paths += '      parameters:\n';
            for (const requiredField of pathParameters) {
              paths += `      - name: "${requiredField}"\n        in: "path"\n        required: true\n        type: "integer"\n`;
            }
          }
          if (r2.schema) {
            const nnn = typeof r2.schema === 'string' ? r2.schema : p.replace(/\//g, '_');
            paths += `      parameters:\n      - in: "body"\n        name: "body"\n        required: true\n        schema:\n          $ref: "#/definitions/${nnn}"\n`;
            if (typeof r2.schema !== 'string') tablesInfo[`${nnn}`] = r2.schema;
          }
          paths += '      responses:\n        "200":\n          description: "Ok"\n';
          if (r2.currentSchema && p !== 'delete') {
            paths += '          schema:\n';
            if (p === 'get' && !pathParameters.length) paths += '            type: "array"\n';
            paths += '            items:\n';
            paths += `              $ref: "#/definitions/${r2.currentSchema}"\n`;
          }
          for (const resp of (r2.responses || [])) {
            if (!routeErrors[`${resp}`]) continue;
            const { status, description } = routeErrors[`${resp}`];
            paths += `        "${status}":\n          description: "${description}"\n`;
          }
        }
      }

      let definitions = 'definitions:\n';
      for (const [tableName, t] of Object.entries(tablesInfo)) {
        if (tableName.match(/^knex_/)) continue;

        definitions += `  ${tableName}:\n    type: "object"\n    properties:\n`;
        for (const [field, opt] of Object.entries(t)) {
          definitions += `      ${field}:\n`;
          const o = (typeof opt === 'string') ? { data_type: opt } : opt;
          if (o.data_type?.match(/text|character varying|timestamp with time zone/)) o.data_type = 'string';
          if (o.data_type?.match(/jsonb?/)) o.data_type = 'object';
          definitions += o.references ? `        $ref: "#/definitions/${o.references.foreign_table_name}"\n` : `        type: "${o.data_type}"\n`;
        }
      }

      this.app.use(
        this.router().get('/swagger.yaml', (ctx) => {
          ctx.body = `${header}\n${paths}\n${definitions}`;
        }).routes(),
      );
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

    const routesList = flow.map((item) => (typeof item.routes === 'function' ? item.routes() : typeof item === 'function' && item)).filter(Boolean);
    routesList.map((item) => this.app.use(item));

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
