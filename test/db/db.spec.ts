import { expect, test, describe } from 'bun:test';
import { getTestClient } from '../lib';
import { Routings, TheAPI } from '../../src';

const router = new Routings({ migrationDirs: ['./test/migrations'] });

router.get('/check-migration', async (c: any) => {
  await c.env.dbWrite('testNews').insert({ name: 'test' });

  c.set('result', await c.env.db('testNews'))
});

const theAPI = new TheAPI({ routings: [router] });
const client = await getTestClient(theAPI);  

describe('DB', async () => {
  test('init', async () => {
    await theAPI.init();
  });

  test('GET /check-migration', async () => {
    const { result } = await client.get('/check-migration');

    expect(result[0].name).toEqual('test');
  });

  test('finalize', async () => {
    await client.deleteTables();
  });
});
