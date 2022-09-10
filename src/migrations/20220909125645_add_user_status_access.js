exports.up = (knex) => knex.schema
  .createTable('user_access', (table) => {
    table.increments('id');
    table.string('name').notNullable();
    table.specificType('statuses', 'varchar(32)[]').defaultTo('{}');
  })
  .then(() => knex.raw(`INSERT INTO user_access (name, statuses) VALUES ('create status', ARRAY ['root']), ('delete status', ARRAY ['root'])`));

exports.down = (knex) => knex.schema
  .dropTable('user_status_access');
