exports.up = (knex) => knex.schema
  .alterTable('langs', (table) => {
    table.renameColumn('text_key', 'textKey');
  });

exports.down = (knex) => knex.schema
  .alterTable('langs', (table) => {
    table.renameColumn('textKey', 'text_key');
  });
