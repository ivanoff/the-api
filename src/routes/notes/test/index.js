const { expect } = require('chai');

describe('Notes', () => {
  const api = new global.TheAPI();
  const { login, notes } = api.routes;

  before(() => api.up([api.extensions.errors, login, notes.public, notes]));

  after(() => api.down());

  describe('Create Category', () => {
    let res;

    it('status 200', async () => {
      res = await global.post('/notes', { title: 'new', uuid: 'fe2ff628-bec9-4908-82c4-8ee2bb7eaeaf', lang: 'aa' });
      expect(res.status).to.eql(200);
    });

    it('with time status 200', async () => {
      res = await global.post('/notes', {
        title: 'new',
        uuid: '023c2dfd-750f-455a-b969-6e6b6a564fa5',
        uuid_public: '754c103c-6e57-4b4a-b383-5061b102df74',
        time: new Date().toISOString(),
      });
      expect(res.status).to.eql(200);
    });
  });

  describe('Update Category', () => {
    let res;

    it('status 200', async () => {
      res = await global.patch({ url: '/notes/2', data: { title: 'new2', public: true, lang: 'zz' } });
      expect(res.status).to.eql(200);
    });
  });

  describe('Get Public Categories', () => {
    let res;

    it('status 200', async () => {
      const data = await global.get('/notes/public');
      expect(data.status).to.eql(200);
      res = await data.json();
    });

    it('only one public record', async () => {
      expect(res).to.be.an('Array').lengthOf(1);
    });
  });

  describe('Get Public Categories by not exists lang', () => {
    let res;

    it('status 200', async () => {
      const data = await global.get('/notes/public?lang=aa');
      expect(data.status).to.eql(200);
      res = await data.json();
    });

    it('only one public record', async () => {
      expect(res).to.be.an('Array').lengthOf(0);
    });
  });

  describe('Get Public Categories by lang', () => {
    let res;

    it('status 200', async () => {
      const data = await global.get('/notes/public?lang=zz');
      expect(data.status).to.eql(200);
      res = await data.json();
    });

    it('only one public record', async () => {
      expect(res).to.be.an('Array').lengthOf(1);
    });
  });

  describe('Get Public Categories By id', () => {
    it('status 200', async () => {
      const data = await global.get('/notes/public/2');
      expect(data.status).to.eql(200);
    });
  });

  describe('Get Public Categories Data', () => {
    it('status 200', async () => {
      const data = await global.get('/notes/public/2/data');
      expect(data.status).to.eql(200);
    });
  });

  describe('Get Non-Public Categories By id', () => {
    it('status 404', async () => {
      const data = await global.get('/notes/public/1');
      expect(data.status).to.eql(404);
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
      res = await global.get('/notes/2');
      expect(res.status).to.eql(200);
    });

    it('second category has new2 name', async () => {
      const data = await res.json();
      expect(data.title).to.eql('new2');
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

  describe('Delete all Data', () => {
    let res;

    it('status 200', async () => {
      res = await global.delete('/notes/1/data');
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
