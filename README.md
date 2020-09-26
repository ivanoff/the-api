# the-api

The API

wait... wait... wait...

## Install

```npm i -S the-api```

or

```yarn add the-api```

## Usage

index.js
```
const TheAPI = require('the-api');
const api = new TheAPI();

const { logs, errors, info, token, access, cache } = api.extensions;
const { login, check, notes } = api.routes;

info.endpointsToShow(login, check, notes);

api.up([
          // select any extension you want to use
  logs,   // log all actions to console with time, unique id, request path and time elapsed since the beginning of the request
  errors, // error handler with app name, version, error codeName, stack, error name and description for developers
  info,   // GET /info endpoint: server currentTime, app name, version, uptime, requests count, endpoints
  login,  // login route - register, login, make and refresh app token
  check,  // check route - small example, just send {ok: 1}
  token,  // check token, return unauthorized if token is invalid
  access, // handle white/black list, count of requests
  cache,  // cache data in memory for 5 seconds
  notes,  // notes route - example of category/notes api
]);
```

### examples

```
curl -vvv localhost:8877/info
```

```
curl -vvv -X POST -d '{"login":"aaa", "password":"bbb"}' --header "Content-Type: application/json" localhost:8877/register
```

```
curl -vvv -X POST -d '{"refresh":"36ae43be-ae49-46b9-ba8a-027dbcf64fa0"}' --header "Content-Type: application/json" localhost:8877/login
```

```
curl -vvv -X POST -d '{"login":"aaa", "password":"bbb"}' --header "Content-Type: application/json" localhost:8877/login
```

## .env

name | description | example | default value
-----|-------------|---------|--------------
PORT | port to listen | 8878 | 8877
JWT_SECRET | JWT secret phrase | nruR3@_123dri!aS | <random uuid>

### Database

DB options for knex

name | description | example | default value
-----|-------------|---------|--------------
DB_CLIENT | client | postgres, mysql, sqlite3 | sqlite3
DB_HOST | DB host | db.server |
DB_USER | DB user | login |
DB_PASSWORD | DB password | password |
DB_NAME | database name | the_api_db
DB_FILENAME | sqlite3 DB filename | ./sqlite.db

### Login Module

name | description | example | default value
-----|-------------|---------|--------------
LOGIN_CHECK_EMAIL | send code to check registration | true, false | false
LOGIN_CHECK_EMAIL_DELAY | waiting for check registration code, minutes | 30 | 60
EMAIL_USER | nodemailer email user | login |
EMAIL_PASSWORD | email password | password |
EMAIL_HOST | email server | smtp.server |
EMAIL_PORT | email port | 587 |
EMAIL_SECURE | nodemailer secure option | true, false |
EMAIL_TLS_REJECTUNAUTH | nodemailer rejectUnauthorized option | true, false |
