exports.up = (knex) => knex.schema
  .alterTable('oauth2_clients', (table) => {
    table.string('client_id', 36).alter();
  });

exports.down = () => (knex) => knex.schema
  .alterTable('oauth2_clients', (table) => {
    table.integer('client_id').alter();
  });
