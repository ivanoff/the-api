import type knex from 'knex';
import type { Hono as HonoType } from 'hono';
import type { Server } from 'bun';
import type { Roles } from 'the-api-roles';
import type { Routings as RoutingsType } from 'the-api-routings';
import type { TheApiOptionsType } from './types';
export declare class TheAPI {
    app: HonoType;
    db: knex.Knex<any, unknown[]> | unknown;
    dbWrite: knex.Knex<any, unknown[]> | unknown;
    dbTables: any;
    waitDb: (() => Promise<unknown>) | unknown;
    roles?: Roles;
    private errors;
    private routings;
    private port;
    private migrationDirs;
    constructor(options?: TheApiOptionsType);
    init(): Promise<void>;
    up(): {
        fetch: (req: Request, server: Server) => Response | Promise<Response>;
        port: number;
    };
    addRoutings(routings: RoutingsType | RoutingsType[]): Promise<void>;
    private _initDbFlow;
    private _initErrorFlow;
    private _initRoutes;
}
//# sourceMappingURL=TheApi.d.ts.map