const checkAccess = require('./check_access');
const crud = require('./crud');
const getCode = require('./code');
const getSwaggerData = require('./swagger');
const getTablesInfo = require('./tables_info');
const KoaKnexHelper = require('./koa_knex_helper');
const Mail = require('./mail');
const relations = require('./relations');
const Router = require('./router');

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
};
