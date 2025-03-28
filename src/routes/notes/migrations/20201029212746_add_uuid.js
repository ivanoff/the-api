exports.up = (knex) => knex.schema
  .table('notes_categories', (table) => {
    table.string('uuid', 36);
    table.unique('uuid');
  })
  .table('notes_data', (table) => {
    table.string('uuid', 36);
    table.unique('uuid');
  });

exports.down = (knex) => knex.schema
  .table('notes_categories', (table) => {
    table.dropColumn('uuid');
  })
  .table('notes_data', (table) => {
    table.dropColumn('uuid');
  });
