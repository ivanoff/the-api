import jwt from 'jsonwebtoken';
import { testClient } from 'hono/testing'
import { TheAPI } from '../src/index.ts';
import { Db } from '../src/Db.ts';
import type knex from 'knex';
import type { IncomingHttpHeaders } from 'http';
import type { MethodsType, TheApiOptionsType } from '../src/types.ts';
import type { Hono, HttpPostBodyType, TestLibParamsType } from './types.ts';

const { db } = new Db();

export class TestClient {
    private app: Hono | undefined;
    private headers?: IncomingHttpHeaders;
    db: knex.Knex<any, unknown[]> | unknown;
    tokens: Partial<Record<string, string>> = {};
    users: Partial<Record<string, {id: number, roles?: string[], token?: string}>> = {
        root: { id: 1, roles: ['root'] },
        admin: { id: 2, roles: ['admin'] },
        registered: { id: 3, roles: ['registered'] },
        manager: { id: 4, roles: ['manager'] },
        unknown: { id: 5, roles: ['unknown'] },
        noRole: { id: 6 },
    };

    constructor(options?: TestLibParamsType) {
        const { app, headers } = options || {};
        if (app) this.app = app;
        if (headers) this.headers = headers;
        this.db = db;
        for (const role of Object.keys(this.users)) {
            this.users[`${role}`].token = this.generateGWT(this.users[`${role}`]);
            this.tokens[`${role}`] = this.users[`${role}`].token || '';
        }
    }

    async init({ app, headers }: TestLibParamsType) {
        this.app = app;
        this.headers = headers;
    }

    async deleteTables() {
        const tables = await db.raw('SELECT table_name, table_schema FROM information_schema.tables WHERE table_schema = current_schema() OR table_schema = \'prefabs\' AND table_catalog = \'postgres\'');
        for (const { table_name, table_schema } of tables.rows) {
            await db.raw(`DROP TABLE IF EXISTS "${table_schema}"."${table_name}" CASCADE`);
        }
        await db.raw('DROP EXTENSION IF EXISTS pg_trgm');
        await db.raw('DROP FUNCTION IF EXISTS collections_time_deleted CASCADE');
        await db.raw('DROP FUNCTION IF EXISTS maps_time_deleted CASCADE');
        await db.raw('DROP FUNCTION IF EXISTS prefabs_time_deleted CASCADE');
    }

    async truncateTables(tables: string[] | string) {
        for (const table of ([] as string[]).concat(tables)) {
              await db(table).del();
        }
    }

    async getClient(options: TheApiOptionsType) {
        const theAPI = new TheAPI(options);
        await theAPI.init();
        return theAPI.app;
    }

    async request(method: MethodsType, path: string, body?: HttpPostBodyType, token?: string) {
        const options = { headers: token ? { Authorization: `BEARER ${token}` } : this.headers };
        const pathArr = path.split('/').slice(1);
        const client = testClient<any>(this.app);
        
        const res = await pathArr.reduce((acc: any, key) => acc[`${key}`], client)[`$${method}`](body, options);

        return res.json();
    }

    async get(path: string, token?: string) {
        return this.request('GET', path, undefined, token);
    }

    async post(path: string, json: HttpPostBodyType, token?: string) {
        return this.request('POST', path, { json }, token);
    }

    async postForm(path: string, form: HttpPostBodyType, token?: string) {
        return this.request('POST', path, { form }, token);
    }

    async patch(path: string, json: HttpPostBodyType, token?: string) {
        return this.request('PATCH', path, { json }, token);
    }

    async put(path: string, json: HttpPostBodyType, token?: string) {
        return this.request('PUT', path, { json }, token);
    }

    async delete(path: string, token?: string) {
        return this.request('DELETE', path, undefined, token);
    }

    generateGWT(params: any, expiresIn: string = process.env.JWT_EXPIRES_IN || '1h'): string {
        return jwt.sign(params, process.env.JWT_SECRET || '', { expiresIn });
    }
}

let instance: TestClient;

export async function getTestClient(options?: TestLibParamsType) {
    if (!instance) {
        instance = new TestClient();
    }

    if (options) await instance.init(options);

    return instance;
}