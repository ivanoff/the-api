const { expect } = require('chai');
const jwt = require('jsonwebtoken');
const TheAPI = require('../../src');

describe('CRUD', () => {
  let api;
  let res;
  let token;

  before(async () => {
    await global.dropDb();

    api = new TheAPI({ migrationDirs: [`${__dirname}/../migrations`] });

    const flags = await api.crud({
      table: 'flags',
      searchFields: ['name', 'country'],
      defaultSort: '-name',
    });

    const securedFlags = await api.crud({
      table: 'flags',
      prefix: 'secured_flags',
      rootRequired: ['add', 'get', 'update', 'delete'],
    });

    await api.up([
      api.extensions.errors,
      flags,
      securedFlags,
    ]);
  });

  after(() => api.down());

  describe('Token ', () => {
    it('get token', async () => {
      token = jwt.sign({
        id: -1,
        login: 'root',
        statuses: ['root'],
      }, process.env.JWT_SECRET, { expiresIn: '1h' });
    });
  });

  describe('usual', () => {
    it('swagger returns 200 status code', async () => {
      res = await global.get('/swagger.yaml');
      expect(res.status).to.eql(200);
    });

    it('returns 404 status code for /unknown', async () => {
      res = await global.get('/unknown');
      expect(res.status).to.eql(404);
    });
  });

  describe('GET /flags empty', () => {
    it('returns 200 status code', async () => {
      res = await global.get('/flags');
      expect(res.status).to.eql(200);
    });
  });

  describe('POST /flags', () => {
    it('returns 200 status code', async () => {
      res = await global.post('/flags', { name: 'flag1' }, { Authorization: `Bearer ${token}` });
      expect(res.status).to.eql(200);

      await global.post('/flags', { name: 'flag3' }, { Authorization: `Bearer ${token}` });
      await global.post('/flags', { name: 'flag2' }, { Authorization: `Bearer ${token}` });
      await global.post('/flags', { name: 'flag4' }, { Authorization: `Bearer ${token}` });
      await global.post('/flags', { name: 'xflag', country: 'France' }, { Authorization: `Bearer ${token}` });
    });
  });

  describe('GET /flags', () => {
    it('iLike search, sort, fields and pagination', async () => {
      res = await global.get('/flags?name~=FLAG%25&_sort=-name&_fields=name&_page=2&_limit=2');
      const { data } = await res.json();
      expect(data).to.deep.equal([{ name: 'flag2' }, { name: 'flag1' }]);
    });

    it('iLike search, sort, fields and offset', async () => {
      res = await global.get('/flags?name~=FLAG%25&_sort=-name&_fields=name&_skip=1&_limit=2');
      const { data } = await res.json();
      expect(data).to.deep.equal([{ name: 'flag3' }, { name: 'flag2' }]);
    });

    it('notWhere search, sort, fields and offset', async () => {
      res = await global.get('/flags?name!=xflag&_sort=name&_fields=name&_limit=2');
      const { data } = await res.json();
      expect(data).to.deep.equal([{ name: 'flag1' }, { name: 'flag2' }]);
    });

    it('iLike search, sort, fields, pagination and offset', async () => {
      res = await global.get('/flags?name~=FLAG%25&_sort=-name&_fields=name&_skip=1&_page=2&_limit=2');
      const { data } = await res.json();
      expect(data).to.deep.equal([{ name: 'flag1' }]);
    });

    it('search for flug3', async () => {
      res = await global.get('/flags?_search=flug3');
      const { data } = await res.json();
      expect(data[0].name).to.equal('flag3');
    });

    it('search for flg1, sort overriding', async () => {
      res = await global.get('/flags?_search=flg1&_sort=-name');
      const { data } = await res.json();
      expect(data[0].name).to.equal('flag4');
    });

    it('search for france', async () => {
      res = await global.get('/flags?_search=franse');
      const { data } = await res.json();
      expect(data[0].name).to.equal('xflag');
    });

    it('random sort', async () => {
      const res1 = await global.get('/flags?_sort=random()&name~=FLAG%25&_fields=name&_limit=1');
      const { data: data1 } = await res1.json();
      const res2 = await global.get('/flags?_sort=random()&name~=FLAG%25&_fields=name&_limit=1');
      const { data: data2 } = await res2.json();
      const res3 = await global.get('/flags?_sort=random()&name~=FLAG%25&_fields=name&_limit=1');
      const { data: data3 } = await res3.json();
      const res4 = await global.get('/flags?_sort=random()&name~=FLAG%25&_fields=name&_limit=1');
      const { data: data4 } = await res4.json();
      const res5 = await global.get('/flags?_sort=random()&name~=FLAG%25&_fields=name&_limit=1');
      const { data: data5 } = await res5.json();
      expect(
        data1[0].name !== data2[0].name
      || data1[0].name !== data3[0].name
      || data1[0].name !== data4[0].name
      || data1[0].name !== data5[0].name
      || data2[0].name !== data3[0].name
      || data2[0].name !== data4[0].name
      || data2[0].name !== data5[0].name
      || data3[0].name !== data4[0].name
      || data3[0].name !== data5[0].name
      || data4[0].name !== data5[0].name,
      ).to.equal(true);
    });
  });

  describe('GET /secured_flags ', () => {
    it('returns 403 status code', async () => {
      res = await global.get('/secured_flags ');
      expect(res.status).to.eql(403);
    });

    it('get token', async () => {
      token = jwt.sign({
        id: -1,
        login: 'root',
        statuses: ['root'],
      }, process.env.JWT_SECRET, { expiresIn: '1h' });
    });

    it('returns 200 status code', async () => {
      res = await global.get('/secured_flags ', { Authorization: `Bearer ${token}` });
      expect(res.status).to.eql(200);
    });
  });
});
