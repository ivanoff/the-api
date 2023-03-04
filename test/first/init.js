require('the-log').silent();

const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));
const sinon = require('sinon');
const nodemailer = require('nodemailer');
const knex = require('knex');
const { expect } = require('chai');

const sendMail = (message, cb) => {
  global.message = message;
  cb(null, 'ok');
};

sinon.stub(nodemailer, 'createTransport').returns({ sendMail });

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

const TheAPI = require('../../src');

const site = 'http://localhost:8877';

const dropDb = async () => {
  const {
    DB_CLIENT: client,
    DB_HOST: host,
    DB_PORT: dbPort,
    DB_USER: user,
    DB_PASSWORD: password,
    DB_NAME: database,
    DB_WRITE_CLIENT: clientWrite,
    DB_WRITE_HOST: hostWrite,
    DB_WRITE_PORT: dbPortWrite,
    DB_WRITE_USER: userWrite,
    DB_WRITE_PASSWORD: passwordWrite,
    DB_WRITE_NAME: databaseWrite,
  } = process.env;

  const connection = hostWrite ? {
    host: hostWrite,
    user: userWrite,
    password: passwordWrite,
    database: databaseWrite,
    port: dbPortWrite,
  } : {
    host, user, password, database, port: dbPort,
  };

  const db = knex({ client: clientWrite || client, connection, useNullAsDefault: true });
  const tables = await db.raw('SELECT table_name FROM information_schema.tables WHERE table_schema = current_schema() AND table_catalog = \'postgres\'');

  const sqlDrops = tables.rows.map(({ table_name }) => `DROP TABLE IF EXISTS ${table_name} CASCADE;`).join('');
  await db.raw(sqlDrops);

  await db.destroy();

  expect(2).to.eql(2);
};

describe('Init', async () => {
  describe('Drop Database', async () => {
    it('drop DB', dropDb);
  });

  describe('Init', async () => {
    global.TheAPI = TheAPI;

    global.dropDb = dropDb;

    const defaultHeaders = { 'Content-Type': 'application/json' };

    global.get = (url, headers) => fetch(site + url, { headers });

    global.post = async (url, data, headers = {}) => fetch(site + url, { method: 'POST', headers: { ...defaultHeaders, ...headers }, body: data && JSON.stringify(data) });

    global.patch = async (url, data, headers = {}) => fetch(site + url, { method: 'PATCH', headers: { ...defaultHeaders, ...headers }, body: data && JSON.stringify(data) });

    global.delete = async (url, headers = {}) => fetch(site + url, { method: 'DELETE', headers });
  });
});
