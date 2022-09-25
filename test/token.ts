import 'mocha';
import { expect } from 'chai';
import {get, post} from './lib/fetch';
import TheAPI from '../src';
import { sleep } from '../src/lib';

describe('Token', () => {
  let api;
  const env = { ...process.env };

  before(async () => {
    api = new TheAPI();
    process.env = { ...process.env, JWT_EXPIRES_IN: '1300ms' };
    const { logs, errors, access } = api.extensions;
    const { login, check } = api.routes;

    await api.up([
      logs,
      errors,
      login,
      access,
      check,
    ]);
  });

  after(() => {
    api.down();
    process.env = env;
  });

  describe('GET /check with token', () => {
    let res;
    let token;

    it('status code 200', async () => {
      await post('/register', { login: 'aaa5', password: 'bbb', email: '2@ivanoff.org.ua' });
      const raw = await post('/login', { login: 'aaa5', password: 'bbb' });
      res = await raw.json();
      expect(raw.status).to.eql(200);
    });

    it('has token', async () => {
      token = res.token;
      expect(token);
    });

    it('GET /check', async () => {
      res = await get('/check', { Authorization: `Bearer ${token}` });
      expect(res.status).to.eql(200);
    });

    it('expires GET /check', async () => {
      await sleep(1800);
      res = await get('/check', { Authorization: `Bearer ${token}` });
      expect(res.status).to.eql(403);
    });
  });

  describe('GET /check without token', () => {
    it('returns 401 status code', async () => {
      const res = await get('/check');
      expect(res.status).to.eql(401);
    });
  });

  describe('GET /check with wrong token', () => {
    it('returns 401 status code', async () => {
      const res = await get('/check', { Authorization: 'Bearer aaa' });
      expect(res.status).to.eql(403);
    });
  });
});
