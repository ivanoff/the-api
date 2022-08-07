exports.up = (knex) => knex.schema
  .alterTable('users', (table) => {
    table.string('external_service', 32);
    table.jsonb('external_id');
    table.jsonb('external_profile');
  });

exports.down = () => (knex) => knex.schema
  .alterTable('users', (table) => {
    table.dropColumn('external_service');
    table.dropColumn('external_id');
    table.dropColumn('external_profile');
  });
