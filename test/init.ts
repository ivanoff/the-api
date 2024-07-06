import { beforeAll, afterAll, mock } from 'bun:test';
import { getTestClient } from './lib';

const c = await getTestClient();

mock.module('nodemailer', () => ({
  createTransport: () => ({ sendMail: (data) => { c.storeValue('email', data) } }),
}));

beforeAll(async () => {
  await c.deleteTables();
});

afterAll(async () => {
  await c.deleteTables();
});
