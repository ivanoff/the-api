process.env = {
  ...process.env,
  NODE_ENV: 'test',
  JWT_SECRET: '123',
  DB_CLIENT: 'postgres',
  DB_HOST: 'localhost',
  DB_PORT: '6433',
  DB_USER: 'postgres',
  DB_PASSWORD: 'postgres',
  DB_DATABASE: 'postgres_test',
  DB_WRITE_CLIENT: 'postgres',
  DB_WRITE_HOST: 'localhost',
  DB_WRITE_PORT: '6433',
  DB_WRITE_USER: 'postgres',
  DB_WRITE_PASSWORD: 'postgres',
  DB_WRITE_DATABASE: 'postgres_test',
  SWAGGER_VERSION: '0.0.1',
  SWAGGER_TITLE: 'Test',
  SWAGGER_HOST: '127.0.0.1',
};

const TheAPI = require('./src');

const api = new TheAPI();

const {
  logs, errors, info, access, limits,
} = api.extensions;
const { login, check, notes } = api.routes;

info.endpointsToShow(login, check, notes);

// login.setTemplates({
//   check: {
//     subject: 'Complete your registration!',
//     text: 'Hello, use your code {{code}} to POST /register/check!',
//     html: 'Hello, use your <b>code {{code}}</b> to POST <b>/register/check</b>!',
//   },
// });

api.up([
  // logs,
  // errors,
  info,
  limits,
  check,
  login,
  access,
  notes,
]);
