const flattening = require('flattening');
const KoaKnexHelper = require('./koa_knex_helper');

module.exports = async ({ ctx, relations }) => {
  const { body } = ctx;
  const result = {};
  const findRelations = async ([key, definition]) => {
    const helper = new KoaKnexHelper(definition);
    const flatData = flattening({ body, result });
    const searchKey = new RegExp(`\\b${key}$`);
    const matchPath = ([path, val]) => (path.match(searchKey) && val);

    ctx.request.query.id = Object.entries(flatData).map(matchPath).filter(Boolean);
    const { data } = await helper.get({ ctx });

    const t = definition.table;
    if (!result[`${t}`]) result[`${t}`] = {};
    for (const d of data) {
      result[`${t}`][d.id] = d;
    }
  };
  await Promise.all(Object.entries(relations).map(findRelations));
  return ctx.body.relations = result;
};
