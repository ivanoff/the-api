const TheAPI = require('./src');
const api = new TheAPI();

const { logs, errors, info, token, access, cache } = api.extensions;
const { login, check, notes } = api.routes;

info.endpointsToShow(login, check, notes);

api.up([
  logs,
  errors,
  info,
  login,
  check,
  token,
  access,
  cache,
  notes,
]);
