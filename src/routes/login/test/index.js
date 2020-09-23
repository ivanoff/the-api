const { expect } = require('chai');

describe('Login', () => {
  const api = new global.TheAPI();
  const env = { ...process.env };

  before(async () => {
    process.env = { NODE_ENV: 'test', LOGIN_CHECK_EMAIL: 'true' };
    await api.up([api.routes.login]);
  });

  after(async () => {
    process.env = env;
    await api.down();
  });

  describe('Register', () => {
    let res;
    let code;

    it('status 200', async () => {
      res = await global.post('/register', { login: 'aaa5', password: 'bbb', email: '2@ivanoff.org.ua' });
      expect(res.status).to.eql(200);
    });

    it('email has `to` property', async () => {
      expect(global.message).to.have.property('to');
    });

    it('email `to` contains right email address', async () => {
      expect(global.message.to).to.eql('2@ivanoff.org.ua');
    });

    it('email has `text` property', async () => {
      expect(global.message).to.have.property('text');
    });

    it('email `text` contains code', async () => {
      const match = global.message.text.match(/(\d{5})/);
      code = match[1];
      expect(!!code).to.eql(true);
    });

    it('check code returns status 200', async () => {
      res = await global.post('/register/check', { code });
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

  describe('Use refresh', () => {
    let res;
    let token;
    let refresh;
    let secondRefresh;

    it('has refresh', async () => {
      const rawRes = await global.post('/login', { login: 'aaa5', password: 'bbb' });
      res = await rawRes.json();
      expect(res).to.have.property('refresh');
      refresh = res.refresh;
    });

    it('has token', async () => {
      expect(res).to.have.property('token');
      token = res.token;
    });

    it('refresh is looks like uuid', async () => {
      expect(refresh.split('-')).to.have.lengthOf(5);
    });

    it('token is looks like jwt', async () => {
      expect(token.split('.')).to.have.lengthOf(3);
    });

    it('get new refresh', async () => {
      res = await global.post('/login', { refresh });
      expect(res.status).to.eql(200);
    });

    it('new refresh is not equat to old one', async () => {
      secondRefresh = (await res.json()).refresh;
      expect(secondRefresh).to.not.eql(refresh);
    });

    it('new refresh is looks like uuid', async () => {
      expect(secondRefresh.split('-')).to.have.lengthOf(5);
    });

    it('get old refresh does not work', async () => {
      res = await global.post('/login', { refresh });
      expect(res.status).to.eql(404);
    });

    it('get new refresh works', async () => {
      res = await global.post('/login', { refresh: secondRefresh });
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
