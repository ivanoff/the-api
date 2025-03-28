exports.up = (knex) => knex.schema
  .table('notes_data', (table) => {
    table.boolean('favorite');
  });

exports.down = (knex) => knex.schema
  .table('notes_data', (table) => {
    table.dropColumn('favorite');
  });
