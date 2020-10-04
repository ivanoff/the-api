const TheAPI = require('./src');
const api = new TheAPI();

const { logs, errors, info, access, limits, cache } = api.extensions;
const { login, check, notes } = api.routes;

info.endpointsToShow(login, check, notes);
limits.setLimits({ 'GET /check/:id' : {minute: 2}})

api.up([
  logs,
  errors,
  info,
  limits,
  check,
  login,
  access,
  cache,
  notes,
]);
