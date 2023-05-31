const flattening = require('flattening');
const KoaKnexHelper = require('./koa_knex_helper');

module.exports = async ({ ctx, relations }) => {
  if (!relations) return;
  const { body } = ctx;
  const result = {};
  const findRelations = async ([key, definition]) => {
    const helper = new KoaKnexHelper(definition);
    const flatData = flattening({ body, result });
    const searchKey = new RegExp(`\\b${key}(\\.\\d+)?$`);
    const matchPath = ([path, val]) => (path.match(searchKey) && val);

    const { query } = ctx.request;
    const id = [...new Set(Object.entries(flatData).map(matchPath).filter(Boolean))];
    if (!id.length) return;

    const name = definition.relation_field_name || 'id';
    ctx.request.query = { [name]: id };
    const { data } = await helper.get({
      ctx: { ...ctx, request: { ...ctx.request, query: { [name]: id } } },
    });
    ctx.request.query = query;

    const t = definition.table;
    if (!result[`${t}`]) result[`${t}`] = {};
    for (const d of data) {
      result[`${t}`][`${d.id}`] = d;
    }
  };
  await Promise.all(Object.entries(relations).map(findRelations));
  if (ctx.body) ctx.body.relations = result;
  return result;
};
