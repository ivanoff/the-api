const getCode = require('./code');
const Mail = require('./mail');
const KoaKnexHelper = require('./koa_knex_helper');
const Router = require('./router');
const getSwaggerData = require('./swagger');
const crudHandler = require('./crud');
const getTablesInfo = require('./tables_info');

const sleep = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

module.exports = {
  sleep, getCode, Mail, KoaKnexHelper, Router, getSwaggerData, crudHandler, getTablesInfo,
};
