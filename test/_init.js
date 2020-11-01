const fetch = require('node-fetch');
const sinon = require('sinon');
const nodemailer = require('nodemailer');

const sendMail = (message, cb) => {
  global.message = message;
  cb(null, 'ok');
};

sinon.stub(nodemailer, 'createTransport').returns({sendMail});

const TheAPI = require('../src');

process.env.NODE_ENV = 'test';

const site = 'http://localhost:8877';
const headers = { 'Content-Type': 'application/json' };

describe('Init', () => {
  global.TheAPI = TheAPI;

  global.get = (url, headers) => fetch(site + url, {headers});

  global.post = async (url, data) => fetch(site + url, { method: 'POST', headers, body: data && JSON.stringify(data) });

  global.patch = async (url, data) => fetch(site + url, { method: 'PATCH', headers, body: data && JSON.stringify(data) });

  global.delete = async (url) => fetch(site + url, { method: 'DELETE' });
})