"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const koa_1 = __importDefault(require("koa"));
const koa_bodyparser_1 = __importDefault(require("koa-bodyparser"));
const koa2_formidable_1 = __importDefault(require("koa2-formidable"));
const koa_passport_1 = __importDefault(require("koa-passport"));
const knex_1 = __importDefault(require("knex"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const fs_migrations_1 = require("knex/lib/migrations/migrate/sources/fs-migrations");
const lib_1 = require("./lib");
const extensions = __importStar(require("./extensions"));
const routes_1 = __importDefault(require("./routes"));
const list_1 = __importDefault(require("./extensions/errors/list"));
require("dotenv/config");
const { npm_package_name: name, npm_package_version: version, PORT, JWT_SECRET, SWAGGER_VERSION, SWAGGER_TITLE, SWAGGER_HOST, SWAGGER_BASEPATH, UPLOAD_MULTIPLY_DISABLED, } = process.env;
class TheAPI {
    constructor({ port = PORT, migrationDirs = [] } = {}) {
        this.port = port || 8877;
        this.app = new koa_1.default();
        this.passport = koa_passport_1.default;
        if (!UPLOAD_MULTIPLY_DISABLED) {
            this.app.use((0, koa2_formidable_1.default)({ multiples: true }));
        }
        this.app.use((0, koa_bodyparser_1.default)());
        this.app.use(this.passport.initialize());
        // eslint-disable-next-line no-console
        this.app.on('error', console.error);
        this.router = () => new lib_1.Router();
        this.routes = routes_1.default;
        this.extensions = extensions;
        this.swaggerOptions = {
            version: SWAGGER_VERSION,
            title: SWAGGER_TITLE,
            host: SWAGGER_HOST,
            basePath: SWAGGER_BASEPATH,
        };
        this.log = (...toLog) => {
            for (const line of toLog) {
                const l = typeof line === 'object' ? JSON.stringify(line) : line;
                // eslint-disable-next-line no-console
                console.log(`[${(new Date()).toISOString()}] ${l}`);
            }
        };
        this.log(`${name} v${version}`);
        const knexDefaultParams = { client: 'sqlite3', connection: ':memory:' };
        this.migrationDirs = [`${__dirname}/migrations`].concat(migrationDirs);
        const { DB_CLIENT: client, DB_HOST: host, DB_PORT: dbPort, DB_USER: user, DB_PASSWORD: password, DB_NAME: database, DB_FILENAME: filename, } = process.env;
        const connection = client === 'sqlite3' && filename ? { filename } : {
            host, user, password, database, port: dbPort,
        };
        const knexParams = client ? { client, connection } : knexDefaultParams;
        this.db = (0, knex_1.default)(Object.assign(Object.assign({}, knexParams), { useNullAsDefault: true }));
        this.waitDb = this.connectDb();
    }
    // generate new random JWT_SECRET
    generateJwtSecret(n = 3) {
        this.log('New JWT_SECRET generated');
        return [...Array(n < 1 ? 1 : n)].map(() => (0, uuid_1.v4)()).join(':');
    }
    checkToken(jwtSecret) {
        this.app.use((ctx, next) => __awaiter(this, void 0, void 0, function* () {
            const { authorization } = ctx.headers;
            if (!authorization)
                return next();
            this.log('Check token');
            const token = authorization.replace(/^bearer\s+/i, '');
            try {
                ctx.state.token = yield jsonwebtoken_1.default.verify(token, jwtSecret);
                yield next();
            }
            catch (err) {
                const isExpired = err.toString().match(/jwt expired/);
                ctx.body = isExpired ? list_1.default.TOKEN_EXPIRED : list_1.default.TOKEN_INVALID;
                ctx.status = ctx.body.status;
            }
        }));
    }
    migrations(flow) {
        return __awaiter(this, void 0, void 0, function* () {
            const migrationDirs = flow.map((item) => item.migration).filter(Boolean);
            if (migrationDirs.length) {
                try {
                    const migrationSource = new fs_migrations_1.FsMigrations(this.migrationDirs.concat(migrationDirs), false);
                    yield this.db.migrate.latest({ migrationSource });
                }
                catch (err) {
                    this.log(err);
                }
            }
        });
    }
    crud(params) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.waitDb;
            return (0, lib_1.crud)(Object.assign({ tableInfo: this.tablesInfo && this.tablesInfo[`${params.table}`] }, params));
        });
    }
    koaKnexHelper(params) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.waitDb;
            return new lib_1.KoaKnexHelper(Object.assign({ tableInfo: this.tablesInfo && this.tablesInfo[`${params.table}`] }, params));
        });
    }
    initServer(flowOrigin) {
        return __awaiter(this, void 0, void 0, function* () {
            const startTime = new Date();
            const requests = { total: 0 };
            const jwtSecret = JWT_SECRET || this.generateJwtSecret();
            this.checkToken(jwtSecret);
            const flowSynced = yield Promise.all(flowOrigin);
            const flowArray = flowSynced.reduce((acc, cur) => (acc.concat(cur)), []).filter(Boolean);
            const flow = yield Promise.all(flowArray);
            const routeErrors = flow.reduce((acc, item) => (Object.assign(Object.assign({}, acc), item.errors)), {});
            const examples = flow.reduce((acc, item) => acc.concat(item.examples), []).filter(Boolean);
            const limits = flow.reduce((acc, item) => (Object.assign(Object.assign({}, acc), item.limits)), {});
            this.extensions.limitsHandler.setLimits(limits);
            const stack = flow.filter((item) => typeof item.routes === 'function')
                .map((item) => item.routes().router.stack).reduce((acc, val) => acc.concat(val), [])
                .map(({ methods, path, regexp }) => ({ methods, path, regexp }));
            yield this.migrations(flow);
            this.tablesInfo = Object.assign({}, yield (0, lib_1.getTablesInfo)(this.db));
            if (this.swaggerOptions.version) {
                const swaggerData = (0, lib_1.getSwaggerData)({
                    flow,
                    options: this.swaggerOptions,
                    tablesInfo: this.tablesInfo,
                });
                const swaggerRoute = this.router().get('/swagger.yaml', (ctx) => {
                    ctx.set('Access-Control-Allow-Origin', '*');
                    ctx.set('Access-Control-Allow-Methods', 'GET');
                    ctx.body = swaggerData;
                }).routes();
                this.app.use(swaggerRoute);
            }
            const accessRaw = yield this.db('user_access').select();
            const userAccess = accessRaw.reduce((cur, acc) => (Object.assign(Object.assign({}, cur), { [acc.name]: acc.statuses })), {});
            this.app.use((ctx, next) => __awaiter(this, void 0, void 0, function* () {
                const { db } = this;
                const { log } = this;
                const requestTime = new Date();
                ctx.state = Object.assign(Object.assign({}, ctx.state), { startTime,
                    requestTime,
                    requests,
                    examples,
                    db,
                    routeErrors,
                    log,
                    stack,
                    jwtSecret, tablesInfo: this.tablesInfo, userAccess });
                ctx.throw = this.log;
                yield next();
            }));
            if (process.env.API_PREFIX) {
                flow.map((item) => item.prefix && item.prefix(process.env.API_PREFIX));
            }
            const routesList = flow.map((item) => (typeof item.routes === 'function' ? item.routes() : typeof item === 'function' && item)).filter(Boolean);
            routesList.map((item) => this.app.use(item));
            this.connection = yield this.app.listen(this.port);
            this.log(`Started on port ${this.port}`);
        });
    }
    up(flow = []) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.waitDb;
            yield this.initServer(flow);
        });
    }
    connectDb() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => {
                this.intervalDbCheck = setInterval(() => __awaiter(this, void 0, void 0, function* () { return this.checkDb().then(resolve); }), 5000);
                this.checkDb().then(resolve);
            });
        });
    }
    checkDb() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.db.raw('select 1+1 as result');
                clearInterval(this.intervalDbCheck);
                this.log('DB connected');
                const migrationSource = new fs_migrations_1.FsMigrations(this.migrationDirs, false);
                yield this.db.migrate.latest({ migrationSource });
                this.log('Migration done');
                this.tablesInfo = Object.assign({}, yield (0, lib_1.getTablesInfo)(this.db));
                this.log(`Tables found: ${Object.keys(this.tablesInfo)}`);
            }
            catch (err) {
                this.log('DB connection error:', err, 'waiting for 5 seconds...');
            }
        });
    }
    down() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.connection)
                yield this.connection.close();
            yield this.db.destroy();
            this.extensions.limitsHandler.destructor();
            this.log('Stopped');
        });
    }
}
exports.default = TheAPI;
