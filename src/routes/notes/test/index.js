const { expect } = require('chai');

describe('Notes', () => {
  const api = new global.TheAPI();

  before(() => api.up([api.extensions.errors, api.routes.login, api.routes.notes]));

  after(() => api.down());

  describe('Create Category', () => {
    let res;

    it('status 200', async () => {
      res = await global.post('/notes', { title: 'new', uuid: 'fe2ff628-bec9-4908-82c4-8ee2bb7eaeaf' });
      expect(res.status).to.eql(200);
    });
  });

  describe('Get Categories', () => {
    let res;

    it('status 200', async () => {
      res = await global.get('/notes');
      expect(res.status).to.eql(200);
    });
  });

  describe('Get One Category', () => {
    let res;

    it('status 200', async () => {
      res = await global.get('/notes/1');
      expect(res.status).to.eql(200);
    });
  });

  describe('Create Note', () => {
    let res;

    it('status 200', async () => {
      res = await global.post('/notes/1/data', { title: 'new data', body: 'Hi', uuid: '0de19904-ef99-4cba-8961-10320563e72a' });
      expect(res.status).to.eql(200);
    });
  });

  describe('Create Couple Notes', () => {
    let res;

    it('status 200', async () => {
      res = await global.post('/notes/1/data', [
        { title: 'second data', body: 'Hi2', uuid: '6e0a0119-3aec-4ad7-bea0-05c0578a7cd7' },
        { title: 'third data', body: 'Hi3', uuid: '3c83aa91-ac65-4e70-9837-418ea45d0882' },
      ]);
      expect(res.status).to.eql(200);
    });
  });

  describe('Get All Data', () => {
    let res;

    it('status 200', async () => {
      res = await global.get('/notes/1/data');
      expect(res.status).to.eql(200);
    });

    it('status 200', async () => {
      const data = await res.json();
      expect(data).to.be.an('Array').lengthOf(3);
    });
  });

  describe('Get Data by unknown Id return 404', () => {
    let res;

    it('status 200', async () => {
      res = await global.get('/notes/1/data/100');
      expect(res.status).to.eql(404);
    });
  });

  describe('Get Data by Id', () => {
    let res;

    it('status 200', async () => {
      res = await global.get('/notes/1/data/1');
      expect(res.status).to.eql(200);
    });
  });

  describe('Get Second Data by Id', () => {
    let res;

    it('status 200', async () => {
      res = await global.get('/notes/1/data/2');
      expect(res.status).to.eql(200);
    });
  });

  describe('Delete Data by Id', () => {
    let res;

    it('status 200', async () => {
      res = await global.delete('/notes/1/data/1');
      expect(res.status).to.eql(200);
    });
  });

  describe('Delete Category by Id', () => {
    let res;

    it('status 200', async () => {
      res = await global.delete('/notes/1');
      expect(res.status).to.eql(200);
    });
  });

  describe('Get Deleted Data', () => {
    let res;

    it('status 404', async () => {
      res = await global.get('/notes/1/data/1');
      expect(res.status).to.eql(404);
    });
  });

  describe('Get Deleted Second Data', () => {
    let res;

    it('status 404', async () => {
      res = await global.get('/notes/1/data/');
      expect(res.status).to.eql(404);
    });
  });

  describe('Get Deleted Category', () => {
    let res;

    it('status 404', async () => {
      res = await global.get('/notes/1');
      expect(res.status).to.eql(404);
    });
  });
});
