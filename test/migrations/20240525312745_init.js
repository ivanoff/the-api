exports.up = (knex) => knex.schema
  .createTable('testTypes', (table) => {
    table.increments('id');
    table.string('name').notNullable();
  })
  .createTable('testTypeAges', (table) => {
    table.increments('id');
    table.integer('typeId')
      .references('id')
      .inTable('testTypes')
      .onUpdate('CASCADE')
      .onDelete('CASCADE');
    table.string('age').notNullable();
  })
  .createTable('testNews', (table) => {
    table.increments('id');
    table.timestamp('timeCreated').notNullable().defaultTo(knex.fn.now());
    table.timestamp('timeUpdated').nullable();
    table.timestamp('timePublished').nullable();
    table.timestamp('timeDeleted').nullable();
    table.boolean('isDeleted').defaultTo(false);
    table.string('name').notNullable();
    table.integer('typeId')
      .references('id')
      .inTable('testTypes')
      .onUpdate('CASCADE')
      .onDelete('SET NULL');
    table.integer('views').defaultTo(0);
    table.integer('userId');
  });

exports.down = (knex) => knex.schema
  .dropTable('testNews');
