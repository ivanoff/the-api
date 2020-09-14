const { expect } = require('chai');

describe('Login', () => {
  const api = new global.TheAPI();
  const env = { ...process.env };

  before(async () => {
    process.env = { NODE_ENV: 'test' };
    await api.up([api.routes.login]);
  });

  after(async () => {
    process.env = env;
    await api.down();
  });

  describe('Register', () => {
    let res;

    it('status 200', async () => {
      res = await global.post('/register', { login: 'aaa5', password: 'bbb', email: '2@ivanoff.org.ua' });
      expect(res.status).to.eql(200);
    });
  });

  describe('Login', () => {
    let res;

    it('status 200', async () => {
      res = await global.post('/login', { login: 'aaa5', password: 'bbb' });
      expect(res.status).to.eql(200);
    });
  });

  describe('Mistakes', () => {
    let res;
    it('status 404', async () => {
      res = await global.post('/login', { login: 'wrong', password: 'bbb' });
      expect(res.status).to.eql(404);
    });
  });
});
