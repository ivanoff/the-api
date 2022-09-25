import flattening from 'flattening';
import KoaKnexHelper from './koa_knex_helper';

export default async ({ ctx, relations }) => {
  if (!relations) return;
  const { body } = ctx;
  const result = {};
  const findRelations = async ([key, definition]) => {
    const helper = new KoaKnexHelper(definition);
    const flatData = flattening({ body, result });
    const searchKey = new RegExp(`\\b${key}(\\.\\d+)?$`);
    const matchPath = ([path, val]) => path.match(searchKey) && val;

    const { query } = ctx.request;
    const id = Object.entries(flatData)
      .map(matchPath)
      .filter(Boolean)
      .filter((v, i, a) => a.indexOf(v) === i);
    if (!id.length) return;

    ctx.request.query = { id };
    const { data } = await helper.get({ ctx });
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
