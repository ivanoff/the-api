const fetch = require('node-fetch');
const TheAPI = require('../src');

process.env.NODE_ENV = 'test';

const site = 'http://localhost:8877';
const headers = { 'Content-Type': 'application/json' };

describe('Init', () => {
  global.TheAPI = TheAPI;

  global.get = url => fetch(site + url);

  global.post = async (url, data) => fetch(site + url, { method: 'POST', headers, body: JSON.stringify(data) });

  global.delete = async (url) => fetch(site + url, { method: 'DELETE' });
})