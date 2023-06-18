const { expect } = require('chai');

describe('Login', () => {
  let api;
  const env = { ...process.env };
  const userData = { login: 'aaa15', password: 'bbb', email: '3@ivanoFF.org.ua' };
  const userData2 = { login: 'aaa8', password: 'bbb' };
  const newPassword = `${userData.password}-${userData.password}`;

  before(async () => {
    process.env = { ...process.env, LOGIN_CHECK_EMAIL: 'true' };

    const setSuperadminRoute = (a) => a.router().post('/set_superadmin', async (ctx) => {
      await ctx.state.db('users').update({ statuses: ['superadmin'] }).where({ login: userData.login });
      ctx.body = { ok: 1 };
    });

    api = new global.TheAPI();
    await api.up([api.extensions.errors, api.routes.login, setSuperadminRoute(api)]);
  });

  after(async () => {
    process.env = env;
    await api.down();
  });

  describe('Register', () => {
    let res;
    let code;
    const { login, password } = userData;

    it('status 200', async () => {
      res = await global.post('/register', userData);
      expect(res.status).to.eql(200);
    });

    it('status 409 for same login', async () => {
      res = await global.post('/register', { ...userData, email: 'wrong' });
      expect(res.status).to.eql(409);
    });

    it('status 409 for same email', async () => {
      res = await global.post('/register', { ...userData, login: 'wrong' });
      expect(res.status).to.eql(409);
    });

    it('status 200', async () => {
      res = await global.post('/login', { login, password });
      expect(res.status).to.eql(200);
    });

    it('email has `to` property', async () => {
      expect(global.message).to.have.property('to');
    });

    it('email `to` contains right email address', async () => {
      expect(global.message.to).to.eql(userData.email.toLowerCase());
    });

    it('email has `text` property', async () => {
      expect(global.message).to.have.property('text');
    });

    it('email `text` contains code', async () => {
      const match = global.message.text.match(/\b([\da-f-]{36})\b/);
      [, code] = match;
      expect(!!code).to.eql(true);
    });

    it('check code with no login returns status 409', async () => {
      res = await global.post('/register/check', { code });
      expect(res.status).to.eql(409);
    });

    it('check code returns status 200', async () => {
      res = await global.post('/register/check', { login, code });
      expect(res.status).to.eql(200);
    });

    it('check code again returns status 409', async () => {
      res = await global.post('/register/check', { login, code });
      expect(res.status).to.eql(409);
    });
  });

  describe('Login', () => {
    let res;
    const { login, password } = userData;

    it('status 200', async () => {
      res = await global.post('/login', { login, password });
      expect(res.status).to.eql(200);
    });
  });

  describe('Use refresh', () => {
    let res;
    let token;
    let refresh;
    let secondRefresh;
    const { login, password } = userData;

    it('has refresh', async () => {
      const rawRes = await global.post('/login', { login, password });
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

    it('new refresh is equal to the old one in case of using refresh token', async () => {
      secondRefresh = (await res.json()).refresh;
      expect(secondRefresh).to.eql(refresh);
    });

    it('new refresh is looks like uuid', async () => {
      expect(secondRefresh.split('-')).to.have.lengthOf(5);
    });

    it('Old refresh token does work', async () => {
      res = await global.post('/login', { refresh });
      expect(res.status).to.eql(200);
    });

    it('New refresh token works', async () => {
      res = await global.post('/login', { refresh: secondRefresh });
      expect(res.status).to.eql(200);
    });
  });

  describe('Restore password', () => {
    let res;
    let code;
    const { login, password, email } = userData;

    it('status 200 for any request', async () => {
      const rawRes = await global.post('/login/forgot', {});
      expect(rawRes.status).to.eql(200);
      res = await rawRes.json();
    });

    it('any request is ok', async () => {
      expect(res).to.have.property('ok');
    });

    it('response for any request ok is 1', async () => {
      expect(res.ok).to.eql(1);
    });

    it('status 200 for wrong request', async () => {
      const rawRes = await global.post('/login/forgot', { login: 'wrong' });
      expect(rawRes.status).to.eql(200);
      res = await rawRes.json();
    });

    it('wrong request is ok', async () => {
      expect(res).to.have.property('ok');
    });

    it('response for wrong request ok is 1', async () => {
      expect(res.ok).to.eql(1);
    });

    it('status 200', async () => {
      const rawRes = await global.post('/login/forgot', { login });
      expect(rawRes.status).to.eql(200);
      res = await rawRes.json();
    });

    it('response is ok', async () => {
      expect(res).to.have.property('ok');
    });

    it('response ok is 1', async () => {
      expect(res.ok).to.eql(1);
    });

    it('email has `to` property', async () => {
      expect(global.message).to.have.property('to');
    });

    it('email `to` contains right email address', async () => {
      expect(global.message.to).to.eql(userData.email.toLowerCase());
    });

    it('email has `text` property', async () => {
      expect(global.message).to.have.property('text');
    });

    it('email `text` contains code', async () => {
      const match = global.message.text.match(/\b([\da-f-]{36})\b/);
      [, code] = match;
      expect(!!code).to.eql(true);
    });

    it('set new password with wrong code', async () => {
      const rawRes = await global.post('/login/restore', { code: 'wrong', password: newPassword });
      expect(rawRes.status).to.eql(409);
    });

    it('set new password', async () => {
      const rawRes = await global.post('/login/restore', { code, password: newPassword });
      expect(rawRes.status).to.eql(200);
      res = await rawRes.json();
    });

    it('try to login with old password result 404', async () => {
      const rawRes = await global.post('/login', { login, password });
      expect(rawRes.status).to.eql(404);
    });

    it('login with new password result has refresh', async () => {
      const rawRes = await global.post('/login', { login, password: newPassword });
      expect(rawRes.status).to.eql(200);
      res = await rawRes.json();
      expect(res).to.have.property('refresh');
    });

    it('try to restore with email 200 status code', async () => {
      const rawRes = await global.post('/login/forgot', { email });
      expect(rawRes.status).to.eql(200);
      res = await rawRes.json();
    });

    it('email `text` contains code', async () => {
      const match = global.message.text.match(/\b([\da-f-]{36})\b/);
      [, code] = match;
      expect(!!code).to.eql(true);
    });

    it('try to restore with old code', async () => {
      const rawRes = await global.post('/login/forgot', { email });
      res = await rawRes.json();
      const rawRes2 = await global.post('/login/restore', { code, password: newPassword });
      expect(rawRes2.status).to.eql(409);
    });
  });

  describe('Update user data', () => {
    const { login, password } = userData2;
    let res;
    let token;
    it('status 200', async () => {
      res = await global.post('/register', userData2);
      expect(res.status).to.eql(200);

      const { id } = await res.json();
      userData2.id = id;
    });

    it('has refresh', async () => {
      const rawRes = await global.post('/login', { login, password });
      res = await rawRes.json();
      token = res.token;
    });

    it('change first name', async () => {
      res = await global.patch('/login', { firstName: 'aaa' }, { Authorization: `Bearer ${token}` });
      expect(res).to.have.property('ok');
    });

    it('change email', async () => {
      res = await global.patch('/login', { email: 'BBB' }, { Authorization: `Bearer ${token}` });
      expect(res).to.have.property('ok');
    });

    it('has refresh', async () => {
      const rawRes = await global.post('/login', { login, password });
      res = await rawRes.json();
      expect(res.firstName).to.eql('aaa');
      expect(res.email).to.eql('bbb');
    });
  });

  describe('Superadmin', () => {
    let res;
    let token;

    it('update user to superadmin', async () => {
      await global.post('/set_superadmin');
    });

    it('has superadmin refresh', async () => {
      const rawRes = await global.post('/login', { login: userData.login, password: newPassword });
      res = await rawRes.json();
      expect(res).to.have.property('token');
      token = res.token;
    });

    it('get other token by user id', async () => {
      const rawRes = await global.get(`/superadmin/tokens/${userData2.id}`, { Authorization: `Bearer ${token}` });
      res = await rawRes.json();
      token = res.token;
    });

    it('change first name', async () => {
      res = await global.patch('/login', { firstName: 'aaaa1' }, { Authorization: `Bearer ${token}` });
      expect(res).to.have.property('ok');
    });

    it('get superadmin token back', async () => {
      const rawRes = await global.delete('/superadmin/tokens', { Authorization: `Bearer ${token}` });
      res = await rawRes.json();
      expect(res.login).to.eql(userData.login);
    });

    it('Check second user first name', async () => {
      const rawRes = await global.post('/login', userData2);
      res = await rawRes.json();
      expect(res.firstName).to.eql('aaaa1');
      token = res.token;
    });
  });

  describe('Mistakes', () => {
    let res;
    it('status 404', async () => {
      res = await global.post('/login', { login: 'wrong', password: 'bbb' });
      expect(res.status).to.eql(404);
    });

    it('status 404', async () => {
      res = await global.post('/login');
      expect(res.status).to.eql(404);
    });

    it('status 404', async () => {
      res = await global.post('/login', {});
      expect(res.status).to.eql(404);
    });

    it('status 409', async () => {
      res = await global.post('/register', { login: '' });
      expect(res.status).to.eql(409);
    });
  });
});
