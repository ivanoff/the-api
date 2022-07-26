/**
 * CRUD helper
 * Usage:
 *  $ cat modules/colors.js
 *   module.exports = require('the-api/crud')({ table: 'colors' });
 *  $ cat index.js
 *   const TheAPI = require('./src');
 *   const api = new TheAPI();
 *   const colors = require('./modules/colors');
 *   api.up([colors]);
 * Generates the following endpoints with CRUD access to `colors` table:
 *  GET /colors
 *  POST /colors
 *  PATCH /colors
 *  DELETE /colors
 */

const Router = require('./router');
const KoaDbHelper = require('./koa_knex_helper');
const checkAccess = require('./check_access');

const router = new Router();

module.exports = (params) => {
  const helper = new KoaDbHelper(params);

  const getAll = async (ctx) => {
    ctx.body = await helper.get({ ctx });
  };

  const getOne = async (ctx) => {
    ctx.body = await helper.getById({ ctx });
    return ctx.body || ctx.warning('NOT_FOUND');
  };

  const add = async (ctx) => {
    ctx.body = await helper.add({ ctx });
  };

  const update = async (ctx) => {
    ctx.body = await helper.update({ ctx });
  };

  const remove = async (ctx) => {
    ctx.body = await helper.delete({ ctx });
  };

  const { access } = params;
  const a = checkAccess && checkAccess[`${access}`];
  const useAccess = a || (async (_ctx, next) => { await next(); });

  return router
    .prefix(`/${params.table}`)
    .use(useAccess)
    .get('/', getAll)
    .get('/:id', getOne)
    .post('/:id', add)
    .put('/:id', update)
    .delete('/:id', remove);
};
