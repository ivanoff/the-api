# the-api

The API

wait... wait... wait...

## Install

`npm i -S the-api`

### .env

```
PORT=8877

POSTGRES_HOST=127.0.0.1
POSTGRES_USER=pg
POSTGRES_PASSWORD=pg
POSTGRES_DB=pg

JWT_SIGN=eb003088-e82e-48d7-9a46-8324d55f1e7a:539c36ca-f771-4505-9ee0-be2b2b64dad4
```

### index.js
```
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
```

### examples

```
curl -vvv localhost:8877/info
```
