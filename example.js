const TheAPI = require('./src');
const api = new TheAPI();

const { logs, errors, info, access, limits, cache } = api.extensions;
const { login, check, notes } = api.routes;

info.endpointsToShow(login, check, notes);

api.up([
  logs,
  errors,
  info,
  login,
  check,
  access,
  limits,
  cache,
  notes,
]);
