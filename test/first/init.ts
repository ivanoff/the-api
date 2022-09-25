import theLog from 'the-log';
theLog.silent();

import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import nodemailer from 'nodemailer';
import knex from 'knex';

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
  SWAGGER_VERSION: '0.0.1',
  SWAGGER_TITLE: 'Test',
  SWAGGER_HOST: '127.0.0.1',
};

const dropDb = async () => {
  const {
    DB_CLIENT: client,
    DB_HOST: host, DB_PORT: dbPort, DB_USER: user, DB_PASSWORD: password, DB_NAME: database,
  } = process.env;

  const connection = {
    host, user, password, database, port: dbPort,
  };

  const db = knex({ client, connection, useNullAsDefault: true });

  try {
    await db.raw('DELETE FROM migrations_lock WHERE is_locked = 1');
  } catch {
    console.log('no migrations_lock table found');
  }

  const tables = await db.raw('SELECT table_name FROM information_schema.tables WHERE table_schema = current_schema() AND table_catalog = \'postgres\'');

  const sqlDrops = tables.rows.map(({ table_name }) => `DROP TABLE IF EXISTS ${table_name} CASCADE;`).join('');
  if (sqlDrops) await db.raw(sqlDrops);

  await db.destroy();

  expect(2).to.eql(2);
};

describe('Init', async () => {
  describe('Drop Database', async () => {
    it('drop DB', dropDb);
  });

  describe('Init', async () => {
    global.dropDb = dropDb;
  });
});
