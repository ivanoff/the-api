const { Router } = require('../../lib');
const c = require('./controller');

const router = new Router();

module.exports = router
  .tag('notes')
  .get('/notes/public', c.getPublicCategories)
  .get('/notes/public/:id', c.getSinglePublicCategory)
  .get('/notes/public/:id/data', c.getPublicData);
