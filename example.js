const TheAPI = require('./src');

const api = new TheAPI();

const {
  logs, errors, info, access, limits,
} = api.extensions;
const { login, check, notes } = api.routes;

info.endpointsToShow(login, check, notes);

login.setTemplates({
  check: {
    subject: 'Complete your registration!',
    text: 'Hello, use your code {{code}} to POST /register/check!',
    html: 'Hello, use your <b>code {{code}}</b> to POST <b>/register/check</b>!',
  },
});

api.up([
  logs,
  errors,
  info,
  limits,
  check,
  login,
  access,
  notes,
]);
