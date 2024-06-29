import { expect, test, describe } from 'bun:test';
import { DateTime } from'luxon';
import { getTestClient } from '../lib';
import { Routings, TheAPI } from '../../src';

const router = new Routings({ migrationDirs: ['./test/migrations'] });

router.crud({ table: 'testTypes' });
router.crud({ table: 'testNews' });

const theAPI = new TheAPI({ routings: [router] });
const client = await getTestClient(theAPI);

describe('GET pagination', () => {
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

  describe('simple', () => {
    test('GET /testNews', async () => {
      const { meta } = await client.get('/testNews');
      expect(meta.total).toEqual(3);
    });

    test('GET /testNews?_limit=1', async () => {
      const { meta } = await client.get('/testNews?_limit=1');
      expect(meta).toEqual({
        total: 3,
        limit: 1,
        skip: 0,
        page: 1,
        nextPage: 2,
        pages: 3,
        isFirstPage: true,
        isLastPage: false,
      });
    });

    test('GET /testNews?_limit=2&_page=1', async () => {
      const { meta } = await client.get('/testNews?_limit=2&_page=1');
      expect(meta).toEqual({
        total: 3,
        limit: 2,
        skip: 0,
        page: 1,
        nextPage: 2,
        pages: 2,
        isFirstPage: true,
        isLastPage: false,
      });
    });

    test('GET /testNews?_limit=2&_page=2', async () => {
      const { meta } = await client.get('/testNews?_limit=2&_page=2');
      expect(meta).toEqual({
        total: 3,
        limit: 2,
        skip: 0,
        page: 2,
        pages: 2,
        isFirstPage: false,
        isLastPage: true,
      });
    });

    test('GET /testNews?_skip=2&_limit=2', async () => {
      const { meta } = await client.get('/testNews?_skip=2&_limit=2');      
      expect(meta).toEqual({
        total: 3,
        limit: 2,
        skip: 2,
        page: 1,
        pages: 1,
        isFirstPage: true,
        isLastPage: true,
      });
    });
  });

  describe('empty results', () => {
    test('GET /testNews?_limit=3&_page=3', async () => {
      const { meta, result } = await client.get('/testNews?_limit=3&_page=3');
      expect(result).toEqual([]);
      expect(meta).toEqual({
        total: 3,
        limit: 3,
        skip: 0,
        page: 3,
        pages: 1,
        isFirstPage: false,
        isLastPage: true,
      });
    });
  });

  test('finalize', async () => {
    await client.deleteTables()
  });
});
