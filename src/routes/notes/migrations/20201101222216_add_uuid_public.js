exports.up = (knex) => knex.schema
  .table('notes_categories', (table) => {
    table.string('uuid_public', 36);
  });

exports.down = (knex) => knex.schema
  .table('notes_categories', (table) => {
    table.dropColumn('uuid_public');
  });
