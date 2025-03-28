module.exports = require('./routes');

module.exports.public = require('./public');

module.exports.errors = require('./errors');

module.exports.migration = `${__dirname}/migrations`;
