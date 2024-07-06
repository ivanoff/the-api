import { knex } from 'knex';
import type { DbOptionsType } from './types';
export declare class Db {
    db: knex.Knex<any, unknown[]>;
    dbWrite: knex.Knex<any, unknown[]>;
    dbTables: any;
    private migrationDirs;
    private intervalDbCheck?;
    constructor(options?: DbOptionsType);
    waitDb(): Promise<unknown>;
    checkDb(): Promise<void>;
    private _getdbTables;
}
//# sourceMappingURL=Db.d.ts.map