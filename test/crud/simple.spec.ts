import { expect, test, describe } from 'bun:test';
import { getTestClient } from '../lib';
import { Routings, TheAPI } from '../../src';

const router = new Routings({ migrationDirs: ['./test/migrations'] });

router.crud({ table: 'testNews' });

const theAPI = new TheAPI({ routings: [router] });
const client = await getTestClient(theAPI);

describe('simple CRUD requests', () => {
  test('init', async () => {
    await theAPI.init();
  });

  test('GET /testNews', async () => {
    const { result } = await client.get('/testNews');

    expect(result).toEqual([]);
  });

  test('POST /testNews { name: \'test123\' }', async () => {
    const { result } = await client.post('/testNews', { name: 'test123',  });

    expect(result.name).toEqual('test123');
  });

  test('GET /testNews', async () => {
    const { result } = await client.get('/testNews');

    expect(result[0].name).toEqual('test123');
  });

  test('GET /testNews/1', async () => {
    const { result } = await client.get('/testNews/1');

    expect(result.name).toEqual('test123');
  });

  test('PATCH /testNews/1 { name: \'test321\' }', async () => {
    const { result } = await client.patch('/testNews/1', { name: 'test321' });
    
    expect(result.name).toEqual('test321');
  });

  test('GET /testNews/1', async () => {
    const { result } = await client.get('/testNews/1');

    expect(result.name).toEqual('test321');
  });

  test('PUT /testNews/1 { name: \'test111\' }', async () => {
    const { result } = await client.put('/testNews/1', { name: 'test111' });

    expect(result.name).toEqual('test111');
  });

  test('GET /testNews/1', async () => {
    const { result } = await client.get('/testNews/1');

    expect(result.name).toEqual('test111');
  });

  test('DELETE /testNews/1', async () => {
    const { result } = await client.delete('/testNews/1');
    
    expect(result.ok).toEqual(true);
  });

  test('GET /testNews/1', async () => {
    const { result } = await client.get('/testNews/1');

    expect(result.error).toEqual(true);
  });

  test('GET /testNews', async () => {
    const { result } = await client.get('/testNews');

    expect(result).toEqual([]);
  });

  test('finalize', async () => {
    await client.deleteTables()
  });
});
