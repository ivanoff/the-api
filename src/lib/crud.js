/**
 * CRUD helper
 * Usage:
 *  $ cat index.js
 *   const TheAPI = require('./src');
 *   const api = new TheAPI();
 *   const colors = api.crud({ table: 'colors' });
 *   api.up([colors]);
 * Generates the following endpoints with CRUD access to `colors` table:
 *  GET /colors
 *  POST /colors
 *  PATCH /colors
 *  DELETE /colors
 */
const Router = require('./router');
const KoaKnexHelper = require('./koa_knex_helper');

module.exports = async (params) => {
  const {
    table, prefix, tag, responseSchema, forbiddenActions = [],
  } = params;

  const helper = new KoaKnexHelper(params);

  const add = async (ctx) => {
    ctx.body = await helper.add({ ctx });
  };

  const getAll = async (ctx) => {
    ctx.body = await helper.get({ ctx });
  };

  const getOne = async (ctx) => {
    ctx.body = await helper.getById({ ctx });
    return ctx.body || ctx.warning('NOT_FOUND');
  };

  const update = async (ctx) => {
    ctx.body = await helper.update({ ctx });
  };

  const remove = async (ctx) => {
    ctx.body = await helper.delete({ ctx });
  };

  const router = new Router();

  const p = `/${prefix || table}`.replace(/^\/+/, '/');

  router.prefix(p)
    .tag(tag || table)
    .responseSchema(responseSchema || table);

  if (!forbiddenActions.includes('get')) router.get('/', getAll, helper.optionsGet()).get('/:id', getOne, helper.optionsGetById());
  if (!forbiddenActions.includes('add')) router.post('/', add, helper.optionsAdd());
  if (!forbiddenActions.includes('update')) router.put('/:id', update, helper.optionsUpdate());
  if (!forbiddenActions.includes('remove')) router.delete('/:id', remove, helper.optionsDelete());

  return router;
};
