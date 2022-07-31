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
    table, endpoint, tag, responseSchema,
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

  return router.prefix(`/${endpoint || table}`)
    .tag(tag || table)
    .responseSchema(responseSchema || table)
    .post('/', add, helper.optionsAdd())
    .get('/', getAll, helper.optionsGet())
    .get('/:id', getOne, helper.optionsGetById())
    .put('/:id', update, helper.optionsUpdate())
    .delete('/:id', remove, helper.optionsDelete());
};
