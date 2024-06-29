import { knex } from 'knex';
import { FsMigrations } from 'knex/lib/migrations/migrate/sources/fs-migrations';
import type { DbOptionsType } from './types';

const {
    DB_HOST: host,
    DB_PORT: port,
    DB_USER: user,
    DB_PASSWORD: password,
    DB_DATABASE: database,
    DB_SCHEMA: schema,
    DB_POOL_MIN: poolMin = 1,
    DB_POOL_MAX: poolMax,
    DB_WRITE_HOST: hostWrite,
    DB_WRITE_PORT: portWrite,
    DB_WRITE_USER: userWrite,
    DB_WRITE_PASSWORD: passwordWrite,
    DB_WRITE_DATABASE: databaseWrite,
    DB_WRITE_SCHEMA: schemaWrite,
    DB_WRITE_POOL_MIN: poolWriteMin = 1,
    DB_WRITE_POOL_MAX: poolWriteMax,
} = process.env;

export class Db {
    public db: knex.Knex<any, unknown[]>;
    public dbWrite: knex.Knex<any, unknown[]>;
    public dbTables: any;
    private migrationDirs: string[] = [];
    private intervalDbCheck?: Timer;

    constructor(options?: DbOptionsType) {
        const { migrationDirs = [] } = options || {};

        const connection = {
            host, user, password, database, port: Number(port), ...(schema && { schema }),
        };
    
        const connectionWrite = {
            host: hostWrite,
            user: userWrite,
            password: passwordWrite,
            database: databaseWrite,
            port: Number(portWrite),
            ...(schemaWrite && { schema: schemaWrite }),
        };

        const pool = poolMax && { min: +poolMin, max: +poolMax };
        const poolWrite = poolWriteMax && { min: +poolWriteMin, max: +poolWriteMax };
        const defaultDbOptions = {
          client: 'pg',
          useNullAsDefault: true,
        };
        this.db = knex({
          connection,
          ...defaultDbOptions,
          ...(pool && { pool }),
        });
        this.dbWrite = !hostWrite ? this.db : knex({
          connection: connectionWrite,
          ...defaultDbOptions,
          ...(poolWrite && { pool: poolWrite }),
        });

        this.migrationDirs = this.migrationDirs
          .concat(migrationDirs)
          .filter((path) => Bun.file(path).size);
    }

    async waitDb() {
        return new Promise((resolve) => {
            this.intervalDbCheck = setInterval(async () => this.checkDb().then(resolve), 5000);
            this.checkDb().then(resolve);
        });
    }
    
    async checkDb() {
        try {
            await this.db.raw('select 1+1 as result');
            await this.dbWrite.raw('select 1+1 as result');
            clearInterval(this.intervalDbCheck);
            console.log('DB connected');

            const migrationSource = new FsMigrations(this.migrationDirs, false);
            await this.dbWrite.migrate.latest({ migrationSource });
            console.log('Migration done');
        
            const similarityThreshold = process.env.DB_TRGM_SIMILARITY_THRESHOLD || 0.1;
            await this.db.raw(`SET pg_trgm.similarity_threshold = ${+similarityThreshold}`);
            await this.dbWrite.raw(`SET pg_trgm.similarity_threshold = ${+similarityThreshold}`);
        
            this.dbTables = { ...await this._getdbTables(this.dbWrite) };
            console.log(`Tables found: ${Object.keys(this.dbTables)}`);
        } catch (err) {
            console.log('DB connection error:', err, 'waiting for 5 seconds...');
        }
    }
    
    private async _getdbTables(db: knex.Knex<any, unknown[]>) {
        let query;
        let bindings: any = [db.client.database()];
      
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
      
        let references = [];
        if (queryRef) {
          const tRef = await db.raw(queryRef, bindings);
          references = tRef.rows || tRef;
        }
      
        const result: any = {};
        await Promise.all(tables.map(async ({ table_schema, table_name }: any) => {
          const tableWithSchema = `${table_schema}.${table_name}`;
          if (db.client.constructor.name === 'Client_PG') {
            const columnInfo = await db.raw('select * from information_schema.columns where table_name = :table_name and table_schema = :table_schema', { table_name, table_schema });
            result[`${tableWithSchema}`] = columnInfo.rows.reduce((acc: any, cur: any) => ({ ...acc, [cur.column_name]: cur }), {});
      
            for (const key of Object.keys(result[`${tableWithSchema}`])) {
              result[`${tableWithSchema}`][`${key}`].references = references.find((item: any) => item.table_name === table_name && item.column_name === key);
            }
          } else {
            result[`${tableWithSchema}`] = await db(table_name).withSchema(table_schema).columnInfo();
          }
        }));
        return result;
      };      
}
