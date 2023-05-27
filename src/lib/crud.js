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
const buildRelations = require('./relations');

module.exports = async (params) => {
  const {
    table, schema, prefix, tag, relations, responseSchema, forbiddenActions = [],
  } = params;

  const add = async (ctx) => {
    const h = new KoaKnexHelper(params);
    ctx.body = await h.add({ ctx });
    if (relations) await buildRelations({ ctx, relations });
  };

  const getAll = async (ctx) => {
    const h = new KoaKnexHelper(params);
    ctx.body = await h.get({ ctx });
    if (relations) await buildRelations({ ctx, relations });
  };

  const getOne = async (ctx) => {
    const h = new KoaKnexHelper(params);
    ctx.body = await h.getById({ ctx });
    if (relations) await buildRelations({ ctx, relations });
    return ctx.body || ctx.throw('NOT_FOUND');
  };

  const update = async (ctx) => {
    const h = new KoaKnexHelper(params);
    ctx.body = await h.update({ ctx });
    if (relations) await buildRelations({ ctx, relations });
  };

  const remove = async (ctx) => {
    const h = new KoaKnexHelper(params);
    ctx.body = await h.delete({ ctx });
  };

  const router = new Router();

  const p = `/${prefix || table}`.replace(/^\/+/, '/');

  router.prefix(p)
    .tag(tag || table)
    .responseSchema(responseSchema || `${schema || 'public'}.${table}`);

  const helper = new KoaKnexHelper(params);
  if (!forbiddenActions.includes('create')) router.post('/', add, helper.optionsAdd());
  if (!forbiddenActions.includes('read')) router.get('/', getAll, helper.optionsGet()).get('/:id', getOne, helper.optionsGetById());
  if (!forbiddenActions.includes('update')) router.put('/:id', update, helper.optionsUpdate());
  if (!forbiddenActions.includes('delete')) router.delete('/:id', remove, helper.optionsDelete());

  return router;
};
