module.exports = require('./routes');

module.exports.errors = require('./errors');

module.exports.limits = require('./limits');

module.exports.migration = `${__dirname}/migrations`;
