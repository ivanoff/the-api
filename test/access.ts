import 'mocha';
import { expect } from 'chai';
import {get, post} from './lib/fetch';
import TheAPI from '../src';

describe('Access', () => {
  let api;

  before(async () => {
    api = new TheAPI();
    const { errors, access, limits, limitsHandler } = api.extensions;
    const { login } = api.routes;

    const test1 = api.router().get('/test1', (ctx) => { ctx.body = { ok: 1 }; });
    const test2 = api.router().get('/test2', (ctx) => { ctx.body = { ok: 1 }; });

    limitsHandler.setLimits({ 'GET /test1': { minute: 1 } });
    limitsHandler.setLimits({ 'GET /test2': { minute: 2 } });

    await api.up([
      errors,
      login,
      limits,
      test1,
      access,
      test2,
    ]);
  });

  after(() => api.down());

  describe('GET /test2', () => {
    let res;
    let token;

    it('GET /test1', async () => {
      res = await get('/test1');
      expect(res.status).to.eql(200);
    });

    it('GET /test1', async () => {
      res = await get('/test1');
      expect(res.status).to.eql(403);
    });

    it('GET /test1', async () => {
      res = await get('/test1');
      expect(res.status).to.eql(403);
    });

    it('status code 200', async () => {
      await post('/register', { login: 'aaa5', password: 'bbb', email: '2@ivanoff.org.ua' });
      const raw = await post('/login', { login: 'aaa5', password: 'bbb' });
      res = await raw.json();
      expect(raw.status).to.eql(200);
      token = res.token;
    });

    it('GET /check', async () => {
      res = await get('/test2', { Authorization: `Bearer ${token}` });
      expect(res.status).to.eql(200);
    });

    it('returns 200 status code', async () => {
      res = await get('/test2', { Authorization: `Bearer ${token}` });
      expect(res.status).to.eql(200);
    });

    it('limited returns 403 status code', async () => {
      res = await get('/test2', { Authorization: `Bearer ${token}` });
      expect(res.status).to.eql(403);
    });

    it('limited returns 403 status code again', async () => {
      res = await get('/test2', { Authorization: `Bearer ${token}` });
      expect(res.status).to.eql(403);
    });
  });
});
