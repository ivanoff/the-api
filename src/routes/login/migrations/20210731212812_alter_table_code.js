exports.up = (knex) => knex.schema
  .alterTable('code', (table) => {
    table.string('code', 128).alter();
  });

exports.down = () => (knex) => knex.schema
  .alterTable('code', (table) => {
    table.string('code', 6).alter();
  });
