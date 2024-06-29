import { expect, test, describe } from 'bun:test';
import { DateTime } from'luxon';
import { getTestClient } from '../lib';
import { Routings, TheAPI } from '../../src';

const router = new Routings({ migrationDirs: ['./test/migrations'] });

router.crud({ table: 'testTypes' });
router.crud({ table: 'testNews' });

const theAPI = new TheAPI({ routings: [router] });
const client = await getTestClient(theAPI);

describe('GET after', () => {
  describe('init', () => {
    test('init', async () => {
      await theAPI.init();
    });
  
    test('create testNews', async () => {
      await client.post('/testTypes', { name: 'type1' });
      await client.post('/testTypes', { name: 'type2' });
      await client.post('/testNews', { name: 'test111', typeId: 1 });
      await client.post('/testNews', { name: 'test112', typeId: 1, timePublished: DateTime.local().setZone('America/New_York').toString()});
      await client.post('/testNews', { name: 'test222', typeId: 2 });
    });
  });

  describe('after by timeCreated, limit 1', () => {
    let nextAfter: string;
    test('GET /testNews?_limit=1&_sort=timeCreated', async () => {
      const { meta, result } = await client.get('/testNews?_limit=1&_sort=timeCreated');
      ({ nextAfter } = meta);
      expect(meta).toEqual({
        nextAfter,
        total: 3,
        limit: 1,
        skip: 0,
        page: 1,
        nextPage: 2,
        pages: 3,
        isFirstPage: true,
        isLastPage: false,
      });
      expect(result[0].id).toEqual(1);
    });

    test('GET /testNews?_limit=1&_sort=timeCreated&_after=nextAfter', async () => {
      const { meta, result } = await client.get(`/testNews?_limit=1&_sort=timeCreated&_after=${nextAfter}`);
      const after = decodeURIComponent(nextAfter);
      ({ nextAfter } = meta);
      expect(after).not.toEqual(nextAfter);
      expect(meta).toEqual({
        total: 3,
        after,
        nextAfter,
        isFirstPage: false,
        isLastPage: false,
      });
      expect(result[0].id).toEqual(2);
    });

    test('GET /testNews?_limit=1&_sort=timeCreated&_after=nextAfter', async () => {
      const { meta, result } = await client.get(`/testNews?_limit=1&_sort=timeCreated&_after=${nextAfter}`);
      const after = decodeURIComponent(nextAfter);
      ({ nextAfter } = meta);
      expect(after).not.toEqual(nextAfter);
      expect(meta).toEqual({
        total: 3,
        after,
        nextAfter,
        isFirstPage: false,
        isLastPage: false,
      });
      expect(result[0].id).toEqual(3);
    });

    test('GET /testNews?_limit=1&_sort=timeCreated&_after=nextAfter', async () => {
      const { meta, result } = await client.get(`/testNews?_limit=1&_sort=timeCreated&_after=${nextAfter}`);
      const after = decodeURIComponent(nextAfter);
      ({ nextAfter } = meta);
      expect(after).not.toEqual(nextAfter);
      expect(meta).toEqual({
        total: 3,
        after,
        nextAfter,
        isFirstPage: false,
        isLastPage: true,
      });
      expect(result).toEqual([]);
    });
  });

  describe('after by timeCreated desc, limit 2', () => {
    let nextAfter: string;
    test('GET /testNews?_limit=2&_sort=-timeCreated', async () => {
      const { meta, result } = await client.get('/testNews?_limit=2&_sort=-timeCreated');
      ({ nextAfter } = meta);
      expect(meta).toEqual({
        nextAfter,
        total: 3,
        limit: 2,
        skip: 0,
        page: 1,
        nextPage: 2,
        pages: 2,
        isFirstPage: true,
        isLastPage: false,
      });
      expect(result[0].id).toEqual(3);
      expect(result[1].id).toEqual(2);
    });

    test('GET /testNews?_limit=2&_sort=-timeCreated&_after=nextAfter1', async () => {
      const { meta, result } = await client.get(`/testNews?_limit=2&_sort=-timeCreated&_after=${nextAfter}`);
      const after = decodeURIComponent(nextAfter);
      ({ nextAfter } = meta);
      expect(after).not.toEqual(nextAfter);
      expect(meta).toEqual({
        total: 3,
        after,
        nextAfter,
        isFirstPage: false,
        isLastPage: true,
      });
      expect(result[0].id).toEqual(1);
    });

    test('GET /testNews?_limit=2&_sort=-timeCreated&_after=nextAfter2', async () => {
      const { meta, result } = await client.get(`/testNews?_limit=2&_sort=-timeCreated&_after=${nextAfter}`);
      const after = decodeURIComponent(nextAfter);
      ({ nextAfter } = meta);
      expect(after).not.toEqual(nextAfter);
      expect(meta).toEqual({
        total: 3,
        after,
        nextAfter,
        isFirstPage: false,
        isLastPage: true,
      });
      expect(result).toEqual([]);
    });
  });

  describe('after by timeCreated desc, limit 2', () => {
    let nextAfter: string;
    test('GET /testNews?_limit=2&_sort=-id', async () => {
      const { meta, result } = await client.get('/testNews?_limit=2&_sort=-id');
      ({ nextAfter } = meta);
      expect(meta).toEqual({
        nextAfter,
        total: 3,
        limit: 2,
        skip: 0,
        page: 1,
        nextPage: 2,
        pages: 2,
        isFirstPage: true,
        isLastPage: false,
      });
      expect(result[0].id).toEqual(3);
      expect(result[1].id).toEqual(2);
    });

    test('GET /testNews?_limit=2&_sort=-id&_after=nextAfter1', async () => {
      const { meta, result } = await client.get(`/testNews?_limit=2&_sort=-id&_after=${nextAfter}`);
      const after = decodeURIComponent(nextAfter);
      ({ nextAfter } = meta);
      expect(after).not.toEqual(nextAfter);
      expect(meta).toEqual({
        total: 3,
        after,
        nextAfter,
        isFirstPage: false,
        isLastPage: true,
      });
      expect(result[0].id).toEqual(1);
    });

    test('GET /testNews?_limit=2&_sort=-id&_after=nextAfter2', async () => {
      const { meta, result } = await client.get(`/testNews?_limit=2&_sort=-id&_after=${nextAfter}`);
      const after = decodeURIComponent(nextAfter);
      ({ nextAfter } = meta);
      expect(after).not.toEqual(nextAfter);
      expect(meta).toEqual({
        total: 3,
        after,
        nextAfter,
        isFirstPage: false,
        isLastPage: true,
      });
      expect(result).toEqual([]);
    });
  });

  test('finalize', async () => {
    await client.deleteTables();
  });
});
