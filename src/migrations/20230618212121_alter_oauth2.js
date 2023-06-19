exports.up = (knex) => knex.schema
  .alterTable('oauth2_clients', (table) => {
    table.integer('userId')
      .notNullable()
      .references('id')
      .inTable('users')
      .onUpdate('CASCADE')
      .onDelete('CASCADE');
  });

exports.down = () => (knex) => knex.schema
  .alterTable('oauth2_clients', (table) => {
    table.dropColumn('userId');
  });
