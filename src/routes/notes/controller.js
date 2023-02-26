const buildRelations = require('../../lib/relations');

async function getCategory(ctx) {
  const { db, token } = ctx.state;
  const { id: user_id = 0 } = token || {};
  const { id } = ctx.params;

  const result = await db('notes_categories').select('*').where({ id, user_id, deleted: false }).first();

  if (!result) throw new Error('NOTE_NOT_FOUND');

  return result;
}

async function getAllCategories(ctx) {
  const { db, token } = ctx.state;
  const { id: user_id = 0 } = token || {};
  ctx.body = await db('notes_categories').where({ user_id, deleted: false });
}

async function getPublicCategories(ctx) {
  const { db } = ctx.state;
  const { lang } = ctx.request.query;
  const where = { public: true, deleted: false };
  if (lang) where.lang = lang;
  ctx.body = await db('notes_categories').where(where);
}

async function createCategory(ctx) {
  const { db, token } = ctx.state;
  const { id: user_id = 0 } = token || {};
  const {
    uuid, uuid_public, title, public: p, lang, time = db.fn.now(),
  } = ctx.request.body;
  ctx.body = await db('notes_categories').insert({
    uuid, uuid_public, title, time, user_id, public: p, lang,
  }).returning('*');
}

async function updateCategory(ctx) {
  const { db, token } = ctx.state;
  const { id: user_id = 0 } = token || {};
  const { id } = ctx.params;
  const {
    uuid, uuid_public, title, public: p, lang, time = db.fn.now(),
  } = ctx.request.body;

  ctx.body = await db('notes_categories').update({
    uuid, uuid_public, title, time, user_id, public: p, lang,
  }).where({ id, user_id, deleted: false });
}

async function getSingleCategory(ctx) {
  const category = await getCategory(ctx);

  const { id } = ctx.params;
  const data = await ctx.state.db('notes_data').where({ notes_category_id: id, deleted: false });
  ctx.body = { ...category, data };
}

async function getSinglePublicCategory(ctx) {
  const { db } = ctx.state;
  const { id } = ctx.params;

  const category = await db('notes_categories').select('*').where({ id, public: true, deleted: false }).first();
  if (!category) throw new Error('NOTE_NOT_FOUND');

  const data = await ctx.state.db('notes_data').where({ notes_category_id: id, deleted: false });
  ctx.body = { ...category, data };
}

async function deleteSingleCategory(ctx) {
  await getCategory(ctx);

  const { id } = ctx.params;
  await ctx.state.db('notes_data').delete().where({ notes_category_id: id });
  ctx.body = await ctx.state.db('notes_categories').delete().where({ id });
}

async function getAllData(ctx) {
  await getCategory(ctx);

  const { id } = ctx.params;
  ctx.body = { data: await ctx.state.db('notes_data').where({ notes_category_id: id, deleted: false }) };
  const relations = {
    notes_category_id: { table: 'notes_categories' },
  };
  await buildRelations({ ctx, relations });
}

async function getPublicData(ctx) {
  const { db } = ctx.state;
  const { id } = ctx.params;

  const category = await db('notes_categories').select('*').where({ id, public: true, deleted: false }).first();
  if (!category) throw new Error('NOTE_NOT_FOUND');

  ctx.body = await ctx.state.db('notes_data').where({ notes_category_id: id, deleted: false });
}

async function createData(ctx) {
  await getCategory(ctx);

  const { id } = ctx.params;

  const looksLikeArray = Object.keys(ctx.request.body).every((j, i) => i === +j);

  const data = [].concat(looksLikeArray ? Object.values(ctx.request.body) : ctx.request.body).map(({
    uuid, title, body, favorite,
  }) => ({
    notes_category_id: id, uuid, title, body, favorite,
  }));

  ctx.body = await ctx.state.db('notes_data').insert(data).returning('*');
}

async function getSingleData(ctx) {
  await getCategory(ctx);

  const { id: notes_category_id, dataId: id } = ctx.params;
  ctx.body = await ctx.state.db('notes_data').where({ id, notes_category_id, deleted: false }).first();
  if (!ctx.body) return ctx.throw('NOTE_RECORD_NOT_FOUND');
}

async function deleteAllData(ctx) {
  await getCategory(ctx);

  const { id: notes_category_id } = ctx.params;
  ctx.body = await ctx.state.db('notes_data').delete().where({ notes_category_id });
}

async function deleteSingleData(ctx) {
  await getCategory(ctx);

  const { id: notes_category_id, dataId: id } = ctx.params;
  ctx.body = await ctx.state.db('notes_data').delete().where({ id, notes_category_id });
}

module.exports = {
  getAllCategories,
  getPublicCategories,
  createCategory,
  updateCategory,
  getSingleCategory,
  getSinglePublicCategory,
  deleteSingleCategory,
  getAllData,
  getPublicData,
  createData,
  getSingleData,
  deleteAllData,
  deleteSingleData,
};
