[![NPM version][npm-version-image]][npm-url]
[![NPM downloads][npm-downloads-image]][npm-url]
[![MIT License][license-image]][license-url]
[![Build Status: Linux][travis-image]][travis-url]
[![Build Status: Windows][appveyor-image]][appveyor-url]
[![Coverage Status][coveralls-image]][coveralls-url]
[![Requirements Status][requires.io-image]][requires.io-url]
![Bundle Size][bundlesize-image]
![Issues][issues-image]
![Stars][stars-image]
![Node version][node-image]
![Contributors][contributors-image]

# the-api

The API

Create API asap. Includes the following:

- log all actions to console with time, unique id, request path and time elapsed since the beginning of the request.

- error handler with app name, version, error codeName, stack, error name and description for developers.

- info endpoint: server currentTime, app name, version, uptime, requests count, endpoints

- login route - register, login, make and refresh app token

- check token, return unauthorized if token is invalid

- handle white/black lists, count of requests

- cache data in memory/redis

- notes route - example of category/notes api

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

- Get info

```
curl -vvv localhost:8877/info
```

- Create User

```
curl -vvv -X POST -d '{"login":"aaa", "password":"bbb"}' --header "Content-Type: application/json" localhost:8877/register
```

- Refresh Token

```
curl -vvv -X POST -d '{"refresh":"36ae43be-ae49-46b9-ba8a-027dbcf64fa0"}' --header "Content-Type: application/json" localhost:8877/login
```

- Get new Token

```
curl -vvv -X POST -d '{"login":"aaa", "password":"bbb"}' --header "Content-Type: application/json" localhost:8877/login
```

## .env

name | description | example | default value
-----|-------------|---------|--------------
PORT | port to listen | 8878 | 8877
API_PREFIX | api prefix | /v1 |
JWT_SECRET | JWT secret phrase | nruR3@_123dri!aS | <random uuid>
JWT_EXPIRES_IN | expressed in seconds or a string describing a time span zeit/ms | 60, 2d, 10h | 1h

### Database

DB options for knex

name | description | example | default value
-----|-------------|---------|--------------
DB_CLIENT | client | postgres, mysql, sqlite3 | sqlite3
DB_HOST | DB host | db.server |
DB_PORT | DB port |
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

## Created by

  Dimitry Ivanov <2@ivanoff.org.ua> # curl -A cv ivanoff.org.ua

[license-image]: http://img.shields.io/badge/license-MIT-blue.svg?style=flat
[license-url]: LICENSE

[npm-url]: https://npmjs.org/package/the-api
[npm-version-image]: http://img.shields.io/npm/v/the-api.svg?style=flat
[npm-downloads-image]: http://img.shields.io/npm/dm/the-api.svg?style=flat

[travis-url]: https://travis-ci.org/ivanoff/the-api
[travis-image]: https://travis-ci.org/ivanoff/the-api.svg?branch=master

[appveyor-url]: https://ci.appveyor.com/project/ivanoff/the-api/branch/master
[appveyor-image]: https://ci.appveyor.com/api/projects/status/lp3nhnam1eyyqh33/branch/master?svg=true

[coveralls-url]: https://coveralls.io/github/ivanoff/the-api?branch=master
[coveralls-image]: https://coveralls.io/repos/github/ivanoff/the-api/badge.svg?branch=master

[requires.io-url]: https://requires.io/github/ivanoff/the-api/requirements/?branch=master
[requires.io-image]: https://requires.io/github/ivanoff/the-api/requirements.svg?branch=master

[bundlesize-image]: https://img.shields.io/bundlephobia/min/the-api
[issues-image]: https://img.shields.io/github/issues/ivanoff/the-api
[stars-image]: https://img.shields.io/packagist/stars/ivanoff/the-api
[node-image]: https://img.shields.io/node/v/the-api
[contributors-image]: https://img.shields.io/github/contributors/ivanoff/the-api
