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

    const idName = definition.relation_field_name || 'id';
    ctx.request.query = { [idName]: id };
    const { data } = await helper.get({
      ctx: { ...ctx, request: { ...ctx.request, query: { [idName]: id } } },
    });
    ctx.request.query = query;

    const t = definition.alias || definition.table;
    if (!result[`${t}`]) result[`${t}`] = {};
    for (const d of data) {
      const idKey = d[`${idName}`];
      result[`${t}`][`${idKey}`] = d;
    }
  };
  await Promise.all(Object.entries(relations).map(findRelations));
  if (ctx.body) ctx.body.relations = result;
  return result;
};
