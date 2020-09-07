class Builder {
  constructor({ router, db }) {
    this.db = db;
    this.router = router();
    this.migration = `${__dirname}/migrations`;
    console.log(db);
  }

  async init() {
    const knex = this.db;
    console.log(await knex.table('notes2_categories').columnInfo());
    console.log(await knex.table('notes2_data').columnInfo());
    console.log(await knex.raw(`
SELECT
    tc.table_schema, 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    `));
    console.log('!!!!!!!!!!!!!!!!!!!!!!');
    console.log('!!!!!!!!!!!!!!!!!!!!!!');
  }

  routes() {
    return () => this.router.get('/test2', (ctx) => { ctx.body = { ok: 1 }; });
  }

  examples() {
    return { 'curl localhost:8878/test': { ok: 1 } };
  }
}

module.exports = Builder;
