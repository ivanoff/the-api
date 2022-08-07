exports.up = (knex) => knex.schema
  .alterTable('users', (table) => {
    table.jsonb('external_profiles');
  });

exports.down = () => (knex) => knex.schema
  .alterTable('users', (table) => {
    table.dropColumn('external_profiles');
  });
