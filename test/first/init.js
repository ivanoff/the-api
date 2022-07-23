require('the-log').silent();
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const sinon = require('sinon');
const nodemailer = require('nodemailer');
const knex = require('knex');
const { expect } = require('chai');

const sendMail = (message, cb) => {
  global.message = message;
  cb(null, 'ok');
};

sinon.stub(nodemailer, 'createTransport').returns({sendMail});

const TheAPI = require('../../src');

process.env = {
  ...process.env,
  NODE_ENV: 'test',
  DB_CLIENT: 'postgres',
  DB_HOST: 'localhost',
  DB_PORT: '6433',
  DB_USER: 'postgres',
  DB_PASSWORD: 'postgres',
  DB_DATABASE: 'postgres_test',
};

const site = 'http://localhost:8877';
const defaultHeaders = { 'Content-Type': 'application/json' };

describe('Init', async () => {

  describe('Drop Database', async () => {
    it('drop DB', async () => {
try{
      const {
        DB_CLIENT: client,
        DB_HOST: host, DB_PORT: dbPort, DB_USER: user, DB_PASSWORD: password, DB_NAME: database,
      } = process.env;

      const connection = { host, user, password, database, port: dbPort };

      const db = knex({ client, connection, useNullAsDefault: true });
      const tables = await db.raw(`SELECT table_name FROM information_schema.tables WHERE table_schema = current_schema() AND table_catalog = 'postgres'`);
      for(const { table_name } of tables.rows) {
        await db.raw(`DROP TABLE IF EXISTS ${table_name} CASCADE`);
      }

      await db.destroy();

      expect(2).to.eql(2);
} catch(err) {
console.log(err) }
    });
  })

  describe('Init', () => {
      global.TheAPI = TheAPI;

      global.get = (url, headers) => fetch(site + url, {headers});

      global.post = async (url, data) => fetch(site + url, { method: 'POST', headers: defaultHeaders, body: data && JSON.stringify(data) });

      global.patch = async ({url, headers, data}) => fetch(site + url, { method: 'PATCH', headers: {...defaultHeaders, ...headers}, body: data && JSON.stringify(data) });

      global.delete = async (url) => fetch(site + url, { method: 'DELETE' });
  })

})
