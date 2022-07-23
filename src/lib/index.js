const getCode = require('./code');
const Mail = require('./mail');
const KoaKnexHelper = require('./koa_knex_helper');

const sleep = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

module.exports = {
  sleep, getCode, Mail, KoaKnexHelper,
};
