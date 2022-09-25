"use strict";
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
/**
 * CRUD helper
 * Usage:
 *  $ cat index.js
 *   const TheAPI = require('./src');
 *   const api = new TheAPI();
 *   const colors = api.crud({ table: 'colors' });
 *   api.up([colors]);
 * Generates the following endpoints with CRUD access to `colors` table:
 *  GET /colors
 *  POST /colors
 *  PATCH /colors
 *  DELETE /colors
 */
const router_1 = __importDefault(require("./router"));
const koa_knex_helper_1 = __importDefault(require("./koa_knex_helper"));
const relations_1 = __importDefault(require("./relations"));
function crud(params) {
    return __awaiter(this, void 0, void 0, function* () {
        const { table, prefix, tag, relations, responseSchema, forbiddenActions = [], } = params;
        const helper = new koa_knex_helper_1.default(params);
        const add = (ctx) => __awaiter(this, void 0, void 0, function* () {
            ctx.body = yield helper.add({ ctx });
            if (relations)
                yield (0, relations_1.default)({ ctx, relations });
        });
        const getAll = (ctx) => __awaiter(this, void 0, void 0, function* () {
            ctx.body = yield helper.get({ ctx });
            if (relations)
                yield (0, relations_1.default)({ ctx, relations });
        });
        const getOne = (ctx) => __awaiter(this, void 0, void 0, function* () {
            ctx.body = yield helper.getById({ ctx });
            if (relations)
                yield (0, relations_1.default)({ ctx, relations });
            return ctx.body || ctx.throw('NOT_FOUND');
        });
        const update = (ctx) => __awaiter(this, void 0, void 0, function* () {
            ctx.body = yield helper.update({ ctx });
            if (relations)
                yield (0, relations_1.default)({ ctx, relations });
        });
        const remove = (ctx) => __awaiter(this, void 0, void 0, function* () {
            ctx.body = yield helper.delete({ ctx });
        });
        const router = new router_1.default();
        const p = `/${prefix || table}`.replace(/^\/+/, '/');
        router.prefix(p)
            .tag(tag || table)
            .responseSchema(responseSchema || table);
        if (!forbiddenActions.includes('create'))
            router.post('/', add, helper.optionsAdd());
        if (!forbiddenActions.includes('read'))
            router.get('/', getAll, helper.optionsGet()).get('/:id', getOne, helper.optionsGetById());
        if (!forbiddenActions.includes('update'))
            router.put('/:id', update, helper.optionsUpdate());
        if (!forbiddenActions.includes('delete'))
            router.delete('/:id', remove, helper.optionsDelete());
        return router;
    });
}
exports.default = crud;
;
