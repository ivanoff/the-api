const MainAPI = require('./src');
const mainAPI = new MainAPI();

const { logs, errors, info, token, access, cache } = mainAPI.extensions;
const { login, test, notes } = mainAPI.routes;

info.endpointsToShow(login, test, notes);

mainAPI.up([
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
