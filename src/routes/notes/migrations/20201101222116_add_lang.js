exports.up = (knex) => knex.schema
  .table('notes_categories', (table) => {
    table.string('lang', 2).defaultTo('en');
  });

exports.down = (knex) => knex.schema
  .table('notes_categories', (table) => {
    table.dropColumn('lang');
  });
