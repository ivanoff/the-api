import fetch from 'node-fetch';

const site = 'http://localhost:8877';

const defaultHeaders = { 'Content-Type': 'application/json' };

const get = (url, headers = {}) => fetch(site + url, { headers });
const post = async (url, data, headers = {}) => fetch(site + url, { method: 'POST', headers: { ...defaultHeaders, ...headers }, body: data && JSON.stringify(data) });
const patch = async (url, data, headers = {}) => fetch(site + url, { method: 'PATCH', headers: { ...defaultHeaders, ...headers }, body: data && JSON.stringify(data) });
const del = async (url, headers = {}) => fetch(site + url, { method: 'DELETE', headers });

export {
  fetch,
  get,
  post,
  patch,
  del,
}
