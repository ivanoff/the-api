const Router = require('@koa/router');
const c = require('./controller');

const router = new Router();

module.exports = router
  .get('/notes', c.getAllCategories)
  .post('/notes', c.createCategory)
  .get('/notes/:id', c.getSingleCategory)
  .delete('/notes/:id', c.deleteSingleCategory)
  .get('/notes/:id/data', c.getAllData)
  .post('/notes/:id/data', c.createData)
  .get('/notes/:id/data/:dataId', c.getSingleData)
  .delete('/notes/:id/data/:dataId', c.deleteSingleData);
