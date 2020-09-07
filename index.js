const TheAPI = require('./src');
const api = new TheAPI();

const { logs, errors, info, token, access, cache } = api.extensions;
const { login, test, notes } = api.routes;

info.endpointsToShow(login, test, notes);

api.up([
  logs,
  errors,
  info,
  login,
  test,
  token,
  access,
  cache,
  notes,
]);
