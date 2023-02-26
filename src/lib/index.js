const checkAccess = require('./check_access');
const crud = require('./crud');
const getCode = require('./code');
const getSwaggerData = require('./swagger');
const getTablesInfo = require('./tables_info');
const KoaKnexHelper = require('./koa_knex_helper');
const Mail = require('./mail');
const relations = require('./relations');
const Router = require('./router');

const updateRouterPath = (ctx) => {
  Object.entries(ctx.params).forEach(([key, value]) => {
    ctx.routerPath = ctx.routerPath.replace(`/:${key}`, `/${value}`);
    ctx.request.query[`${key}`] = value;
  });
};

const sleep = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

module.exports = {
  checkAccess,
  crud,
  getCode,
  getSwaggerData,
  getTablesInfo,
  KoaKnexHelper,
  Mail,
  sleep,
  relations,
  Router,
  updateRouterPath,
};
