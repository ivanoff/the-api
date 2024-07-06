import { describe, expect, test, mock } from 'bun:test';
import { Routings } from 'the-api-routings';
import { getTestClient } from './lib';
import { TheAPI, middlewares } from '../src';
import type { contextType } from '../src';

const router = new Routings();

router.get('/email_text', async (c: contextType) => {
  c.env.email({ to: 'test@test', subject: 'hi', text: 'hi2' });
});

router.get('/email_template1', async (c: contextType) => {
  c.env.email({ to: 'test@test', template: 'testTemplate1' });
});

router.get('/email_template2', async (c: contextType) => {
  c.env.email({ to: 'test@test', template: 'testTemplate2' });
});

router.get('/email_data', async (c: contextType) => {
  c.env.email({ to: 'test@test', template: 'testData', data: { name: { firstName: 'aa' } } });
});

router.emailTemplates({
  testTemplate1: {
    subject: 'aa',
    text: 'aa2',
  },
})

const emailTemplates = {
  testTemplate2: {
    subject: 'bb',
    text: 'bb2',
  },
  testData: {
    subject: '{{name.firstName}}!',
    text: 'Hello, {{name.firstName}}',
  },
};

const theAPI = new TheAPI({ emailTemplates, routings: [middlewares.errors, middlewares.email, router] });
const client = await getTestClient(theAPI);

describe.only('email', () => {
  test('init', async () => {
    await theAPI.init();
  });

  test('GET /email_text', async () => {
    await client.get('/email_text');
    expect(client.getValue('email').html).toEqual('hi2');
  });

  test('GET /email_template', async () => {
    await client.get('/email_template1');
    expect(client.getValue('email').html).toEqual('aa2');
  });

  test('GET /email_template2', async () => {
    await client.get('/email_template2');
    expect(client.getValue('email').html).toEqual('bb2');
  });

  test('GET /email_data', async () => {
    await client.get('/email_data');
    expect(client.getValue('email').subject).toEqual('aa!');
    expect(client.getValue('email').html).toEqual('Hello, aa');
  });

  test('finalize', async () => {
    await client.deleteTables()
  });
});