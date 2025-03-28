exports.up = (knex) => knex.schema
  .alterTable('users', (table) => {
    table.jsonb('external_profiles');
    table.timestamp('time_created').defaultTo(knex.fn.now());
    table.timestamp('time_updated');
  });

exports.down = () => (knex) => knex.schema
  .alterTable('users', (table) => {
    table.dropColumn('time_updated');
    table.dropColumn('time_created');
    table.dropColumn('external_profiles');
  });
