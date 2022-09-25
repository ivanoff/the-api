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
const flattening_1 = __importDefault(require("flattening"));
const koa_knex_helper_1 = __importDefault(require("./koa_knex_helper"));
exports.default = ({ ctx, relations }) => __awaiter(void 0, void 0, void 0, function* () {
    if (!relations)
        return;
    const { body } = ctx;
    const result = {};
    const findRelations = ([key, definition]) => __awaiter(void 0, void 0, void 0, function* () {
        const helper = new koa_knex_helper_1.default(definition);
        const flatData = (0, flattening_1.default)({ body, result });
        const searchKey = new RegExp(`\\b${key}(\\.\\d+)?$`);
        const matchPath = ([path, val]) => (path.match(searchKey) && val);
        const { query } = ctx.request;
        const id = Object.entries(flatData).map(matchPath).filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);
        if (!id.length)
            return;
        ctx.request.query = { id };
        const { data } = yield helper.get({ ctx });
        ctx.request.query = query;
        const t = definition.table;
        if (!result[`${t}`])
            result[`${t}`] = {};
        for (const d of data) {
            result[`${t}`][`${d.id}`] = d;
        }
    });
    yield Promise.all(Object.entries(relations).map(findRelations));
    if (ctx.body)
        ctx.body.relations = result;
    return result;
});
