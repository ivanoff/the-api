module.exports = async (db) => {
  let query;
  let bindings = [db.client.database()];

  switch (db.client.constructor.name) {
    case 'Client_MSSQL':
      query = 'SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema = \'public\' AND table_catalog = ?';
      break;
    case 'Client_MySQL':
    case 'Client_MySQL2':
      query = 'SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema = ?';
      break;
    case 'Client_Oracle':
    case 'Client_Oracledb':
      query = 'SELECT table_schema, table_name FROM user_tables';
      bindings = undefined;
      break;
    case 'Client_PG':
      query = `SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog', 'information_schema')`;
      bindings = undefined;
      break;
    case 'Client_SQLite3':
      query = `SELECT '' as table_schema, name AS table_name FROM sqlite_master WHERE type='table'`;
      bindings = undefined;
      break;
    default:
      throw new Error('Unknown database');
  }

  const t = await db.raw(query, bindings);
  const tables = t.rows || t;

  let queryRef;

  switch (db.client.constructor.name) {
    case 'Client_MSSQL':
    case 'Client_MySQL':
    case 'Client_MySQL2':
    case 'Client_Oracle':
    case 'Client_Oracledb':
    case 'Client_SQLite3':
      queryRef = '';
      break;
    case 'Client_PG':
      queryRef = `SELECT
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
          WHERE tc.constraint_type = 'FOREIGN KEY'`;
      break;
    default:
      throw new Error('Unknown database');
  }

  let references = {};
  if (queryRef) {
    const tRef = await db.raw(queryRef, bindings);
    references = tRef.rows || tRef;
  }

  const result = {};
  await Promise.all(tables.map(async ({ table_schema, table_name }) => {
    const tableWithSchema = `${table_schema}.${table_name}`;
    if (db.client.constructor.name === 'Client_PG') {
      const columnInfo = await db.raw('select * from information_schema.columns where table_name = :table_name and table_schema = :table_schema', { table_name, table_schema });
      result[`${tableWithSchema}`] = columnInfo.rows.reduce((acc, cur) => ({ ...acc, [cur.column_name]: cur }), {});

      for (const key of Object.keys(result[`${tableWithSchema}`])) {
        result[`${tableWithSchema}`][`${key}`].references = references.find((item) => item.table_name === table_name && item.column_name === key);
      }
    } else {
      result[`${tableWithSchema}`] = await db(table_name).withSchema(table_schema).columnInfo();
    }
  }));
  return result;
};
