exports.up = (knex) => knex.schema
  .createTable('langs', (table) => {
    table.increments('id');
    table.integer('text_key').notNullable();
    table.string('lang', 2).notNullable();
    table.string('text', 4096).notNullable();
  })
  .then(() => knex.raw(`
    CREATE INDEX IF NOT EXISTS langs_text_idx ON langs (text);
    CREATE INDEX IF NOT EXISTS langs_text_key_idx ON langs (text_key);
    CREATE INDEX IF NOT EXISTS langs_lang_text_idx ON langs (lang, text);
    CREATE UNIQUE INDEX IF NOT EXISTS langs_lang_text_key_idx ON langs (lang, text_key);
  `));

exports.down = (knex) => knex.schema.dropTable('langs');
