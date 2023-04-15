exports.up = (knex) => knex.schema
  .raw(`
    CREATE EXTENSION IF NOT EXISTS pg_trgm;
  `);

exports.down = (knex) => knex.schema
  .raw(`
    DROP EXTENSION IF EXISTS pg_trgm;
  `);
