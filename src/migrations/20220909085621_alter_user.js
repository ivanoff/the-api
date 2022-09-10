exports.up = (knex) => knex.schema
  .alterTable('users', (table) => {
    table.specificType('statuses', 'varchar(32)[]').defaultTo('{}');
  })
  .then(() => knex.raw(`UPDATE users SET statuses = array_append('{}', status)`))
  .then(() => knex.schema.alterTable('users', (table) => {
    table.dropColumn('status');
  }));

exports.down = (knex) => knex.schema
  .alterTable('users', (table) => {
    table.specificType('status', 'varchar(32)');
  })
  .then(() => knex.raw(`UPDATE users SET status = (statuses)[1]`))
  .alterTable('users', (table) => {
    table.dropColumn('statuses');
  });
