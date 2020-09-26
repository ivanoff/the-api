const getCode = require('./code');
const Mail = require('./mail');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = {
  sleep, getCode, Mail,
};
