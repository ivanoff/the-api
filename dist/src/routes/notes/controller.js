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
const relations_1 = __importDefault(require("../../lib/relations"));
function getCategory(ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        const { db, token } = ctx.state;
        const { id: user_id = 0 } = token || {};
        const { id } = ctx.params;
        const result = yield db('notes_categories').select('*').where({ id, user_id, deleted: false }).first();
        if (!result)
            throw new Error('NOTE_NOT_FOUND');
        return result;
    });
}
function getAllCategories(ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        const { db, token } = ctx.state;
        const { id: user_id = 0 } = token || {};
        ctx.body = yield db('notes_categories').where({ user_id, deleted: false });
    });
}
function getPublicCategories(ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        const { db } = ctx.state;
        const { lang } = ctx.request.query;
        const where = Object.assign({ public: true, deleted: false }, (lang && { lang }));
        ctx.body = yield db('notes_categories').where(where);
    });
}
function createCategory(ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        const { db, token } = ctx.state;
        const { id: user_id = 0 } = token || {};
        const { uuid, uuid_public, title, public: p, lang, time = db.fn.now(), } = ctx.request.body;
        ctx.body = yield db('notes_categories').insert({
            uuid, uuid_public, title, time, user_id, public: p, lang,
        }).returning('*');
    });
}
function updateCategory(ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        const { db, token } = ctx.state;
        const { id: user_id = 0 } = token || {};
        const { id } = ctx.params;
        const { uuid, uuid_public, title, public: p, lang, time = db.fn.now(), } = ctx.request.body;
        ctx.body = yield db('notes_categories').update({
            uuid, uuid_public, title, time, user_id, public: p, lang,
        }).where({ id, user_id, deleted: false });
    });
}
function getSingleCategory(ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        const category = yield getCategory(ctx);
        const { id } = ctx.params;
        const data = yield ctx.state.db('notes_data').where({ notes_category_id: id, deleted: false });
        ctx.body = Object.assign(Object.assign({}, category), { data });
    });
}
function getSinglePublicCategory(ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        const { db } = ctx.state;
        const { id } = ctx.params;
        const category = yield db('notes_categories').select('*').where({ id, public: true, deleted: false }).first();
        if (!category)
            throw new Error('NOTE_NOT_FOUND');
        const data = yield ctx.state.db('notes_data').where({ notes_category_id: id, deleted: false });
        ctx.body = Object.assign(Object.assign({}, category), { data });
    });
}
function deleteSingleCategory(ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        yield getCategory(ctx);
        const { id } = ctx.params;
        yield ctx.state.db('notes_data').delete().where({ notes_category_id: id });
        ctx.body = yield ctx.state.db('notes_categories').delete().where({ id });
    });
}
function getAllData(ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        yield getCategory(ctx);
        const { id } = ctx.params;
        ctx.body = { data: yield ctx.state.db('notes_data').where({ notes_category_id: id, deleted: false }) };
        const relations = {
            notes_category_id: { table: 'notes_categories' },
        };
        yield (0, relations_1.default)({ ctx, relations });
    });
}
function getPublicData(ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        const { db } = ctx.state;
        const { id } = ctx.params;
        const category = yield db('notes_categories').select('*').where({ id, public: true, deleted: false }).first();
        if (!category)
            throw new Error('NOTE_NOT_FOUND');
        ctx.body = yield ctx.state.db('notes_data').where({ notes_category_id: id, deleted: false });
    });
}
function createData(ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        yield getCategory(ctx);
        const { id } = ctx.params;
        const looksLikeArray = Object.keys(ctx.request.body).every((j, i) => i === +j);
        const data = [].concat(looksLikeArray ? Object.values(ctx.request.body) : ctx.request.body).map(({ uuid, title, body, favorite, }) => ({
            notes_category_id: id, uuid, title, body, favorite,
        }));
        ctx.body = yield ctx.state.db('notes_data').insert(data).returning('*');
    });
}
function getSingleData(ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        yield getCategory(ctx);
        const { id: notes_category_id, dataId: id } = ctx.params;
        ctx.body = yield ctx.state.db('notes_data').where({ id, notes_category_id, deleted: false }).first();
        if (!ctx.body)
            ctx.throw('NOTE_RECORD_NOT_FOUND');
    });
}
function deleteAllData(ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        yield getCategory(ctx);
        const { id: notes_category_id } = ctx.params;
        ctx.body = yield ctx.state.db('notes_data').delete().where({ notes_category_id });
    });
}
function deleteSingleData(ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        yield getCategory(ctx);
        const { id: notes_category_id, dataId: id } = ctx.params;
        ctx.body = yield ctx.state.db('notes_data').delete().where({ id, notes_category_id });
    });
}
exports.default = {
    getAllCategories,
    getPublicCategories,
    createCategory,
    updateCategory,
    getSingleCategory,
    getSinglePublicCategory,
    deleteSingleCategory,
    getAllData,
    getPublicData,
    createData,
    getSingleData,
    deleteAllData,
    deleteSingleData,
};
