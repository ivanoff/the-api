const logs = require('./logs/index');
const errors = require('./errors/index');
const info = require('./info/index');
const token = require('./token/index');
const access = require('./access/index');
const cache = require('./cache/index');

module.exports = {
  logs, errors, info, token, access, cache,
};
