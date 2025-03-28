exports.up = (knex) => knex.schema
  .alterTable('users', (table) => {
    table.renameColumn('external_profiles', 'externalProfiles');
    table.renameColumn('time_created', 'timeCreated');
    table.renameColumn('time_updated', 'timeUpdated');
    table.renameColumn('first_name', 'firstName');
    table.renameColumn('second_name', 'secondName');
  });

exports.down = () => (knex) => knex.schema
  .alterTable('users', (table) => {
    table.renameColumn('externalProfiles', 'external_profiles');
    table.renameColumn('timeCreated', 'time_created');
    table.renameColumn('timeUpdated', 'time_updated');
    table.renameColumn('firstName', 'first_name');
    table.renameColumn('secondName', 'second_name');
  });
