exports.up = (knex) => knex.schema
  .createTable('notes_categories', (table) => {
    table.increments('id');
    table.integer('user_id');
    table.timestamp('time').defaultTo(knex.fn.now());
    table.string('title');
    table.boolean('deleted').defaultTo(false);
  })
  .createTable('notes_data', (table) => {
    table.increments('id');
    table.integer('notes_category_id').unsigned().notNullable();
    table.string('title');
    table.string('body');
    table.boolean('deleted').defaultTo(false);
    table.foreign('notes_category_id').references('id').inTable('notes_categories');
  });

exports.down = (knex) => knex.schema
  .dropTable('notes_data')
  .dropTable('notes_categories');
