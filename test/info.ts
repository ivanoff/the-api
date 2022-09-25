import 'mocha';
import { expect } from 'chai';
import {get} from './lib/fetch';
import TheAPI from '../src';

describe('Info', () => {
  let api;

  before(async () => {
    api = new TheAPI();
    const {
      logs, errors, info, infoHandler,
    } = api.extensions;
    const { check } = api.routes;

    infoHandler.endpointsToShow(check);

    await api.up([
      logs,
      errors,
      info,
    ]);
  });

  after(() => api.down());

  describe('GET /info', () => {
    let res;

    it('returns 200 status code', async () => {
      res = await get('/info');
      expect(res.status).to.eql(200);
    });

    it('returns 404 status code for /unknown', async () => {
      res = await get('/unknown');
      expect(res.status).to.eql(404);
    });
  });
});
