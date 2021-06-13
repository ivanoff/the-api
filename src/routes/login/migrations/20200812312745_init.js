exports.up = (knex) => knex.schema
  .createTable('users', (table) => {
    table.increments('id');
    table.string('login').notNullable();
    table.string('password', 64).notNullable();
    table.string('salt', 36).notNullable();
    table.string('refresh', 36).notNullable();
    table.string('status');
    table.string('first_name');
    table.string('second_name');
    table.string('email');
    table.jsonb('options');
    table.boolean('deleted').defaultTo(false);
  })
  .createTable('code', (table) => {
    table.increments('id');
    table.integer('user_id');
    table.string('login');
    table.string('code', 6);
    table.string('recover', 36);
    table.timestamp('time').defaultTo(knex.fn.now());
    table.integer('attempts').defaultTo(0);
  });

exports.down = (knex) => knex.schema
  .dropTable('code')
  .dropTable('users');
