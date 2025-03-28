const { Router } = require('../../lib');
const c = require('./controller');

const router = new Router();

module.exports = router
  .tag('notes')
  .get('/notes', c.getAllCategories)
  .post('/notes', c.createCategory)
  .get('/notes/:id', c.getSingleCategory)
  .patch('/notes/:id', c.updateCategory)
  .delete('/notes/:id', c.deleteSingleCategory)
  .get('/notes/:id/data', c.getAllData)
  .post('/notes/:id/data', c.createData)
  .delete('/notes/:id/data', c.deleteAllData)
  .get('/notes/:id/data/:dataId', c.getSingleData)
  .delete('/notes/:id/data/:dataId', c.deleteSingleData);
