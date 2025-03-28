exports.up = (knex) => knex.schema
  .alterTable('users', (table) => {
    table.boolean('isUnsubscribed').defaultTo(false);
    table.string('emailToChange');
  });

exports.down = () => (knex) => knex.schema
  .alterTable('users', (table) => {
    table.dropColumn('isUnsubscribed');
    table.dropColumn('emailToChange');
  });
