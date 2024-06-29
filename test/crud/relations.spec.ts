import { expect, test, describe } from 'bun:test';
import { getTestClient } from '../lib';
import { Routings, TheAPI } from '../../src';
import {type  CrudBuilderOptionsType } from '../../src';

const router = new Routings({ migrationDirs: ['./test/migrations'] });

const typeDefinition: CrudBuilderOptionsType = { table: 'testTypes' };

router.crud(typeDefinition);

router.crud({
  table: 'testTypeAges',
  relations: {
    typeId: typeDefinition,
  },
});

const theAPI = new TheAPI({ routings: [router] });
const client = await getTestClient(theAPI);

describe('GET relations', () => {
  describe('init', () => {
    test('init', async () => {
      await theAPI.init();
    });
  
    test('create testNews', async () => {
      await client.post('/testTypes', { name: 'type1' });
      await client.post('/testTypes', { name: 'type2' });
      await client.post('/testTypes', { name: 'type3' });
      await client.post('/testTypes', { name: 'type4' });
      await client.post('/testTypes', { name: 'type5' });
      await client.post('/testTypeAges', { age: '0-3', typeId: 1 });
      await client.post('/testTypeAges', { age: '3-6', typeId: 1 });
      await client.post('/testTypeAges', { age: '7-14', typeId: 1 });
      await client.post('/testTypeAges', { age: '7-14', typeId: 2 });
      await client.post('/testTypeAges', { age: '15-21', typeId: 2 });
      await client.post('/testTypeAges', { age: '22-99', typeId: 4 });
    });
  });

  describe('join', () => {
    test('GET /testTypeAges', async () => {
      const { relations } = await client.get('/testTypeAges');
      expect(relations).toEqual({
        typeId: {
          "1": {
            id: 1,
            name: "type1",
          },
          "2": {
            id: 2,
            name: "type2",
          },
          "4": {
            id: 4,
            name: "type4",
          },
        },
      });
    });
  });

  test('finalize', async () => {
    await client.deleteTables()
  });
});
