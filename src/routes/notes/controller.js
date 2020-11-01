async function getCategory(ctx) {
  const { db, token } = ctx.state;
  const { user_id = 0 } = token || {};
  const { id } = ctx.params;

  const result = await db('notes_categories').select('*').where({ id, user_id, deleted: false }).first();

  if (!result) throw new Error('NOTE_NOT_FOUND');

  return result;
}

async function getAllCategories(ctx) {
  const { db, token } = ctx.state;
  const { user_id = 0 } = token || {};
  ctx.body = await db('notes_categories').where({ user_id, deleted: false });
}

async function createCategory(ctx) {
  const { db, token } = ctx.state;
  const { user_id = 0 } = token || {};
  const { uuid, title, time = db.fn.now() } = ctx.request.body;
  ctx.body = await db('notes_categories').insert({
    uuid, title, time, user_id,
  }).returning('*');
}

async function updateCategory(ctx) {
  const { db, token } = ctx.state;
  const { user_id = 0 } = token || {};
  const { id } = ctx.params;
  const { uuid, title, time = db.fn.now() } = ctx.request.body;

  ctx.body = await db('notes_categories').update({
    uuid, title, time, user_id,
  }).where({ id, user_id, deleted: false });
}

async function getSingleCategory(ctx) {
  const category = await getCategory(ctx);

  const { id } = ctx.params;
  const data = await ctx.state.db('notes_data').where({ notes_category_id: id, deleted: false });
  ctx.body = { ...category, data };
}

async function deleteSingleCategory(ctx) {
  await getCategory(ctx);

  const { id } = ctx.params;
  ctx.body = await ctx.state.db('notes_categories').update({ deleted: true }).where({ id, deleted: false });
  await ctx.state.db('notes_data').update({ deleted: true }).where({ notes_category_id: id });
}

async function getAllData(ctx) {
  await getCategory(ctx);

  const { id } = ctx.params;
  ctx.body = await ctx.state.db('notes_data').where({ notes_category_id: id, deleted: false });
}

async function createData(ctx) {
  await getCategory(ctx);

  const { id } = ctx.params;
  const data = [].concat(ctx.request.body).map(({ uuid, title, body }) => ({
    notes_category_id: id, uuid, title, body,
  }));

  ctx.body = await ctx.state.db('notes_data').insert(data).returning('*');
}

async function getSingleData(ctx) {
  await getCategory(ctx);

  const { id: notes_category_id, dataId: id } = ctx.params;
  ctx.body = await ctx.state.db('notes_data').where({ id, notes_category_id, deleted: false }).first();
  if (!ctx.body) ctx.warning('NOTE_RECORD_NOT_FOUND');
}

async function deleteSingleData(ctx) {
  await getCategory(ctx);

  const { id: notes_category_id, dataId: id } = ctx.params;
  ctx.body = await ctx.state.db('notes_data').update({ deleted: true }).where({ id, notes_category_id });
}

module.exports = {
  getAllCategories,
  createCategory,
  updateCategory,
  getSingleCategory,
  deleteSingleCategory,
  getAllData,
  createData,
  getSingleData,
  deleteSingleData,
};
