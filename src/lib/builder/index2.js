const Koa = require('koa');
const cors = require('@koa/cors');
const Router = require('koa-router');
const koaBody = require('koa-body');

const LoginRoute = require('./routes/login');
const RegisterRoute = require('./routes/register');

const Base = require('./base');

class Api extends Base {
  constructor(config = {}) {
    super(config);
    this.links = [];

    this.app = new Koa();
    this.router = new Router();

    this.app.context.config = this.config;
    this.app.context.error = this.error;
    this.app.context.delayedData = {};

    this.app.use(this.logHandler());
    this.app.use(this.errorHandler.bind(this));
    this.app.use(cors(this.config.corsOptions || {}));
    this.app.use(koaBody());

    if (this.config.token) {
      this.loginRoute = new LoginRoute(this);
      this.registerRoute = new RegisterRoute(this);
    }
  }

  async destroy() {
    await this.stop();
    await super.destroy();
  }

  async start() {
    await this.models.login.init();

    this.app.use(this.router.routes());

    const { host, port = 8877, standalone } = this.config.server || {};

    if (standalone) {
      this.log.info('standalone server started');
      return;
    }

    this.server = await this.app.listen(port, host);
    this.log.info(`server started on ${host || '*'}:${port}`);
  }

  async stop() {
    this.log.info('closing...');
    if (this.server) await this.server.close();
  }

  async model(name, schema, opt = {}) {
    if (!name) throw new Error(this.error.MODEL_HAS_NO_NAME);

    await this.models.checkConnection();

    const {
      links, openMethods, denyMethods, updateGet, updateGetOne,
      updatePost, updateDelete, updatePut, updatePatch,
    } = opt;
    if (links) this.links.push({ [name]: links });

    const security = this.config.token && this.security(openMethods, denyMethods);

    await Promise.all([
      this.routes(name, this.router, this.controllers, links, security,
        updateGet, updateGetOne, updatePost, updateDelete, updatePut, updatePatch),
      this.models.create(name, schema, links),
    ]);
    this.log.info(`${name} model registered`);
  }

  async initData(name, data = []) {
    const jobs = [];
    for (const body of data) {
      jobs.push(this.models.db(name).insert(body));
    }
    await Promise.all(jobs);
  }

  async user({ login, password, md5 } = {}) {
    if (!login || (!password && !md5)) throw 'USER_NEED_CREDENTIALS';
    if (!await this.models.db.schema.hasTable(this.models.login.name)) {
      await this.models.login.init();
    }
    await this.models.login.insert({ login, password, md5 });
  }
}

module.exports = Api;
