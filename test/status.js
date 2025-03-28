const { expect } = require('chai');
const jwt = require('jsonwebtoken');

describe('Status', () => {
  let api;
  let res;
  let token;
  let userId;
  const login = 'aaa29';
  const password = 'bbb';

  before(async () => {
    api = new global.TheAPI();
    await api.up([
      api.extensions.errors,
      api.routes.login,
    ]);
  });

  after(() => api.down());

  describe('Register', () => {
    it('register user', async () => {
      await global.post('/register', { login, password, email: '29@ivanoff.org.ua' });
      const raw = await global.post('/login', { login, password });
      res = await raw.json();
      userId = res.id;
      token = res.token;
      expect(raw.status).to.eql(200);
    });
  });

  describe('By root', () => {
    let rootToken;

    it('get root token', async () => {
      rootToken = jwt.sign({
        id: -1,
        login: 'root',
        statuses: ['root'],
      }, process.env.JWT_SECRET, { expiresIn: '1h' });
      expect(rootToken);
    });

    it('Create forbidden status', async () => {
      res = await global.post(`/users/${userId}/statuses/default`, {}, { Authorization: `Bearer ${rootToken}` });
      expect(res.status).to.eql(403);
    });

    it('Create new status', async () => {
      res = await global.post(`/users/${userId}/statuses/delayed`, {}, { Authorization: `Bearer ${rootToken}` });
      expect(res.status).to.eql(200);
    });

    it('check user status by root', async () => {
      const raw = await global.post('/login', { login, password });
      const { statuses } = await raw.json();
      expect(statuses).to.deep.eql(['registered', 'delayed']);
    });

    it('Create the same status', async () => {
      res = await global.post(`/users/${userId}/statuses/delayed`, {}, { Authorization: `Bearer ${rootToken}` });
      expect(res.status).to.eql(200);
    });

    it('check user status again', async () => {
      const raw = await global.post('/login', { login, password });
      const { statuses } = await raw.json();
      expect(statuses).to.deep.eql(['registered', 'delayed']);
    });

    it('Delete status', async () => {
      res = await global.delete(`/users/${userId}/statuses/delayed`, { Authorization: `Bearer ${rootToken}` });
      expect(res.status).to.eql(200);
    });

    it('check user deleted status', async () => {
      const raw = await global.post('/login', { login, password });
      const { statuses } = await raw.json();
      expect(statuses).to.deep.eql(['registered']);
    });

    it('Delete the same status', async () => {
      res = await global.delete(`/users/${userId}/statuses/delayed`, { Authorization: `Bearer ${rootToken}` });
      expect(res.status).to.eql(200);
    });

    it('check user deleted status again', async () => {
      const raw = await global.post('/login', { login, password });
      const { statuses } = await raw.json();
      expect(statuses).to.deep.eql(['registered']);
    });
  });

  describe('By user', () => {
    it('Create new status', async () => {
      res = await global.post(`/users/${userId}/statuses/delayed`, {}, { Authorization: `Bearer ${token}` });
      expect(res.status).to.eql(403);
    });

    it('check user status by user', async () => {
      const raw = await global.post('/login', { login, password });
      const { statuses } = await raw.json();
      expect(statuses).to.deep.eql(['registered']);
    });

    it('Delete status', async () => {
      res = await global.delete(`/users/${userId}/statuses/delayed`, { Authorization: `Bearer ${token}` });
      expect(res.status).to.eql(403);
    });

    it('check user deleted status', async () => {
      const raw = await global.post('/login', { login, password });
      const { statuses } = await raw.json();
      expect(statuses).to.deep.eql(['registered']);
    });

    it('Delete the same status', async () => {
      res = await global.delete(`/users/${userId}/statuses/registered`, { Authorization: `Bearer ${token}` });
      expect(res.status).to.eql(403);
    });

    it('check user deleted status again', async () => {
      const raw = await global.post('/login', { login, password });
      const { statuses } = await raw.json();
      expect(statuses).to.deep.eql(['registered']);
    });
  });

  describe('By nobody', () => {
    it('Create new status', async () => {
      res = await global.post(`/users/${userId}/statuses/delayed`, {});
      expect(res.status).to.eql(401);
    });

    it('check user status by nobody', async () => {
      const raw = await global.post('/login', { login, password });
      const { statuses } = await raw.json();
      expect(statuses).to.deep.eql(['registered']);
    });

    it('Delete status', async () => {
      res = await global.delete(`/users/${userId}/statuses/delayed`);
      expect(res.status).to.eql(401);
    });

    it('check user deleted status', async () => {
      const raw = await global.post('/login', { login, password });
      const { statuses } = await raw.json();
      expect(statuses).to.deep.eql(['registered']);
    });

    it('Delete the same status', async () => {
      res = await global.delete(`/users/${userId}/statuses/registered`);
      expect(res.status).to.eql(401);
    });

    it('check user deleted status again', async () => {
      const raw = await global.post('/login', { login, password });
      const { statuses } = await raw.json();
      expect(statuses).to.deep.eql(['registered']);
    });
  });
});
