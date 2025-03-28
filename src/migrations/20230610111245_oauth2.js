exports.up = (knex) => knex.schema
  .createTable('oauth2_clients', (table) => {
    table.increments('id');
    table.integer('client_id');
    table.string('name', 512);
    table.string('secret', 36).notNullable();
    table.jsonb('redirect_uris').defaultTo('[]');
  })
  .createTable('oauth2_tokens', (table) => {
    table.increments('id');
    table.integer('oauth2_client_id')
      .notNullable()
      .references('id')
      .inTable('oauth2_clients')
      .onUpdate('CASCADE')
      .onDelete('CASCADE');
    table.integer('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onUpdate('CASCADE')
      .onDelete('CASCADE');
    table.jsonb('scope').defaultTo('[]');
    table.string('code', 36);
    table.string('access_token', 36);
    table.timestamp('access_token_ttl').defaultTo(knex.fn.now());
    table.string('refresh_token', 36);
    table.timestamp('refresh_token_ttl').defaultTo(knex.fn.now());
  });

exports.down = (knex) => knex.schema
  .dropTable('oauth2_tokens')
  .dropTable('oauth2_clients');
