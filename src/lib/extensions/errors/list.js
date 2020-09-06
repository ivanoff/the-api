const mainErrors = require('./errors/main');
const tokenErrors = require('./errors/token');

module.exports = { ...mainErrors, ...tokenErrors };
