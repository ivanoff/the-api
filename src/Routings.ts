import { createFactory } from 'hono/factory';
import CrudBuilder from './CrudBuilder';
import type {
    CrudBuilderOptionsType,
    MiddlewareHandler,
    PushToRoutesParamsType,
    RoutesErrorsType,
    RoutesType,
    RoutingsOptionsType,
} from './types';

const factory = createFactory();

export class Routings {
    routes: RoutesType[] = [];
    routesPermissions: any = {};
    routesErrors: RoutesErrorsType = {};
    migrationDirs: string[] | unknown;

    constructor (options?: RoutingsOptionsType) {
        const { migrationDirs } = options || {};
        if (migrationDirs) this.migrationDirs = migrationDirs;
    }

    private pushToRoutes({ method, path, fnArr }: PushToRoutesParamsType) {
        for (const fn of fnArr) {
            const handlers = factory.createHandlers(fn);
            this.routes.push({ path, method, handlers });
        }
    }

    get(path: string, ...fnArr: MiddlewareHandler[]) {
        this.pushToRoutes({ method: 'GET', path, fnArr });
    }

    post(path: string, ...fnArr: MiddlewareHandler[]) {
        this.pushToRoutes({ method: 'POST', path, fnArr });
    }

    patch(path: string, ...fnArr: MiddlewareHandler[]) {
        this.pushToRoutes({ method: 'PATCH', path, fnArr });
    }

    put(path: string, ...fnArr: MiddlewareHandler[]) {
        this.pushToRoutes({ method: 'PUT', path, fnArr });
    }

    delete(path: string, ...fnArr: MiddlewareHandler[]) {
        this.pushToRoutes({ method: 'DELETE', path, fnArr });
    }

    use(path: string, ...fnArr: MiddlewareHandler[]) {
        this.pushToRoutes({ path, fnArr });
    }

    crud(params: CrudBuilderOptionsType) {
        const { table, prefix, permissions } = params;
        // const { table, prefix, tag, relations, responseSchema, forbiddenActions = [] } = params;

        const p = `/${prefix || table}`.replace(/^\/+/, '/');

        this.get(`${p}`, async (c) => {
            const crudBuilder = new CrudBuilder(params);
            await crudBuilder.get(c);
        });
        this.post(`${p}`, async (c) => {
            const crudBuilder = new CrudBuilder(params);
            await crudBuilder.add(c);
        });
        this.get(`${p}/:id`, async (c) => {
            const crudBuilder = new CrudBuilder(params);
            await crudBuilder.getById(c);
        });
        this.put(`${p}/:id`, async (c) => {
            const crudBuilder = new CrudBuilder(params);
            await crudBuilder.update(c);
        });
        this.patch(`${p}/:id`, async (c) => {
            const crudBuilder = new CrudBuilder(params);
            await crudBuilder.update(c);
        });
        this.delete(`${p}/:id`, async (c) => {
            const crudBuilder = new CrudBuilder(params);
            await crudBuilder.delete(c);
        });

        if (permissions?.protectedMethods) {
            const updteRoutesPermissions = (path: string, method: string) => {
                const key = `${method} ${path}`;
                if (!this.routesPermissions[`${key}`]) this.routesPermissions[`${key}`] = [];
                this.routesPermissions[`${key}`].push(`${p.replace(/^\//, '')}.${method.toLowerCase()}`);
            };

            const methods = permissions?.protectedMethods?.[0] === '*' ? ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] : permissions?.protectedMethods;
            for (const method of methods) {
                if (method === 'POST' || method === 'GET') updteRoutesPermissions(`${p}`, method);
                if (method !== 'POST') updteRoutesPermissions(`${p}/:id`, method);
            }
        }
    }

    errors(err: RoutesErrorsType | RoutesErrorsType[]) {
        const errArr = Array.isArray(err) ? err : [err];
        errArr.map((e) => this.routesErrors = {...this.routesErrors, ...e});
    }
}
