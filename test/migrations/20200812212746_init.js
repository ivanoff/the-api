exports.up = (knex) => knex.schema.withSchema('public')
  .createTable('flags', (table) => {
    table.increments('id');
    table.string('name');
    table.string('country');
    table.boolean('deleted').defaultTo(false);
  });

exports.down = (knex) => knex.schema.withSchema('public')
  .dropTable('flags');
