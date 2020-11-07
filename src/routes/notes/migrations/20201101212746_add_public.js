exports.up = (knex) => knex.schema
  .table('notes_categories', (table) => {
    table.boolean('public').defaultTo(false);
  });

exports.down = (knex) => knex.schema
  .table('notes_categories', (table) => {
    table.dropColumn('public');
  });
