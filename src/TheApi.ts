import { Hono } from 'hono';
import { RegExpRouter } from 'hono/router/reg-exp-router'
import { resolve } from 'path';
import { Routings } from 'the-api-routings';
import { Db } from './Db';
import { beginRoute, endRoute } from './middlewares/default';
import { relationsRoute } from './middlewares/relations';
import type knex from 'knex';
import type { Context, Next, Hono as HonoType, MiddlewareHandler } from 'hono';
import type { Server } from 'bun';
import type { Roles } from 'the-api-roles';
import type { Routings as RoutingsType } from 'the-api-routings';
import type { TheApiOptionsType, EmailTemplatesType } from './types';
const {
    PORT = 7788,
    DB_HOST: dbHost,
    DB_WRITE_HOST: dbHostWrite,
} = process.env;

export class TheAPI {
    app: HonoType;
    db: knex.Knex<any, unknown[]> | unknown;
    dbWrite: knex.Knex<any, unknown[]> | unknown;
    dbTables: any;
    waitDb: (() => Promise<unknown>) | unknown;
    roles?: Roles;
    private errors: any;
    private routings: RoutingsType[];
    private port: number;
    private migrationDirs: string[] = [resolve(`${import.meta.dir}/../src/migrations`)];
    emailTemplates: Record<string, EmailTemplatesType>;

    constructor(options?: TheApiOptionsType) {
        const { routings, roles, emailTemplates, port, migrationDirs } = options || {};
        this.app = new Hono({ router: new RegExpRouter() });
        this.roles = roles;
        this.emailTemplates = emailTemplates;
        this.routings = routings || [];
        this.port = port || +PORT;
        if (migrationDirs) this.migrationDirs = migrationDirs;
    }

    async init() {
        this._initErrorFlow();

        if (dbHost || dbHostWrite) {
            for(const { migrationDirs } of this.routings) {
                if (!Array.isArray(migrationDirs)) continue;
                this.migrationDirs = this.migrationDirs.concat(migrationDirs);
            }
            const db = new Db({ migrationDirs: this.migrationDirs });
            await db.waitDb();
            this._initDbFlow(db);
        }

        this._initRoutes();
    }

    up() {
        this.init();
        return {
          fetch: (req: Request, server: Server) => this.app.fetch(req, { ip: server.requestIP(req) }),
          port: this.port,
        }
    }

    async addRoutings(routings: RoutingsType | RoutingsType[]) {
        this.routings = this.routings.concat(routings);
    }

    private _initDbFlow(db: Db) {
        this.app.all('*', async (c: Context, n: Next) => {
            if (!c.env) c.env = {};
            c.env.db = db.db;
            c.env.dbWrite = db.dbWrite;
            c.env.dbTables = db.dbTables;

            await n();
        });
    }

    private _initErrorFlow() {
        this.app.onError((err, c: Context) => c.env.error(err));

        for(const { routesErrors, routesEmailTemplates } of [beginRoute, relationsRoute, ...this.routings, endRoute]) {
            this.errors = { ...this.errors, ...routesErrors };
            this.emailTemplates = { ...this.emailTemplates, ...routesEmailTemplates };
        }

        this.app.all('*', async (c: Context, n: Next) => {
            if (!c.env) c.env = {};
            c.env.getErrorByMessage = (message: any) => this.errors[`${message}`];
            c.env.getTempplateByName = (name: string) => this.emailTemplates[`${name}`] || {};
            c.env.roles = this.roles;

            await n();
        });
    }

    private _initRoutes() {
        const rolesRoute = new Routings();
        if (this.roles) rolesRoute.use('*', this.roles.rolesMiddleware);

        const routesArr = [
            beginRoute,
            rolesRoute,
            relationsRoute,
            ...this.routings,
            endRoute
        ];

        for(const { routes, routesPermissions } of routesArr) {
            this.roles?.addRoutePermissions(routesPermissions);

            routes.map((route) => route.method ? 
                this.app[`${route.method.toLowerCase()}`](route.path, ...route.handlers)
                : this.app.all(route.path, ...route.handlers as unknown as MiddlewareHandler[]))
        }
    }
}
