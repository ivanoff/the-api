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
const uuid_1 = require("uuid");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const mail_1 = __importDefault(require("./mail"));
const lib_1 = require("../../lib");
const mail = new mail_1.default();
const tokenFields = ['id', 'login', 'statuses', 'first_name'];
const sha256 = (data) => crypto_1.default.createHash('sha256').update(data, 'utf8').digest('hex');
function loginTool({ ctx, login: loginOrigin, password, refresh, id: byId, }) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!loginOrigin && !refresh && !byId)
            return {};
        const { db, jwtSecret } = ctx.state;
        const search = loginOrigin ? { login: loginOrigin } : refresh ? { refresh } : { id: byId };
        const user = (yield db('users').where(Object.assign(Object.assign({}, search), { deleted: false })).first());
        if (!user)
            return {};
        const { id, login, password: passDb, salt, statuses, first_name, second_name, email, options, } = user;
        if (loginOrigin && passDb !== sha256(password + salt))
            return {};
        const forbidUnconfirmed = process.env.LOGIN_UNCONFIRMED_FORBID === 'true';
        if (statuses.includes('unconfirmed') && forbidUnconfirmed)
            return { id, statuses };
        const { JWT_EXPIRES_IN: expiresIn } = process.env;
        const dataToSign = tokenFields.reduce((acc, key) => { acc[`${key}`] = user[`${key}`]; return acc; }, {});
        const token = jsonwebtoken_1.default.sign(dataToSign, jwtSecret, { expiresIn: expiresIn || '1h' });
        const refreshNew = refresh || (0, uuid_1.v4)();
        if (!refresh)
            yield db('users').update({ refresh: refreshNew }).where({ id });
        return {
            id, login, statuses, token, first_name, second_name, email, options, refresh: refreshNew,
        };
    });
}
function externalLogin({ ctx, service, profile, external_id, first_name, second_name, email, }) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!service || !external_id)
            return ctx.throw('EXTERNALS_REQUIRED');
        const { db, jwtSecret } = ctx.state;
        const { JWT_EXPIRES_IN: expiresIn } = process.env;
        const refresh = (0, uuid_1.v4)();
        let user = yield db('users').where({ email }).first();
        const _id = `${external_id}`;
        const { rows: userByServiceArr } = yield db.raw(`SELECT * FROM users WHERE external_profiles @> '[{"provider":??,"_id":??}]'`, [service, _id]);
        const userByService = userByServiceArr[0];
        if (!user && userByService)
            user = userByService;
        if (!user) {
            const salt = (0, uuid_1.v4)();
            [user] = yield db('users').insert({
                login: email,
                password: sha256((0, uuid_1.v4)() + salt),
                salt,
                email,
                first_name,
                second_name,
                refresh,
                statuses: ['registered'],
                external_profiles: JSON.stringify([Object.assign(Object.assign({}, profile), { _id })]),
            }).returning('*');
        }
        else if (!userByService) {
            yield db('users').where({ email }).update({
                external_profiles: JSON.stringify([].concat(user.external_profiles, Object.assign(Object.assign({}, profile), { _id })).filter(Boolean)),
            });
        }
        const result = {
            id: user.id,
            statuses: user.statuses,
            refresh: user.refresh,
            login: user.login,
            email: user.email,
            first_name,
            second_name,
            token: '',
        };
        const dataToSign = tokenFields.reduce((acc, key) => { acc[`${key}`] = user[`${key}`]; return acc; }, {});
        result.token = jsonwebtoken_1.default.sign(dataToSign, jwtSecret, { expiresIn: expiresIn || '1h' });
        ctx.body = result;
    });
}
function loginHandler(ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        const { login, password, refresh } = ctx.request.body;
        const loginResult = yield loginTool({
            ctx, login, password, refresh,
        });
        const { statuses } = loginResult;
        if (!statuses)
            return ctx.throw('USER_NOT_FOUND');
        const forbidUnconfirmed = process.env.LOGIN_UNCONFIRMED_FORBID === 'true';
        if (statuses.includes('unconfirmed') && forbidUnconfirmed)
            return ctx.throw('EMAIL_NOT_CONFIRMED');
        ctx.body = loginResult;
    });
}
function register(ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        const { login, password, email, first_name, second_name, } = ctx.request.body;
        if (!login)
            return ctx.throw('LOGIN_REQUIRED');
        const { db } = ctx.state;
        const salt = (0, uuid_1.v4)();
        const userLogin = (yield db('users').where({ login }).first());
        if (userLogin)
            return ctx.throw('LOGIN_EXISTS');
        const userEmail = email && (yield db('users').where({ email }).first());
        if (userEmail)
            return ctx.throw('EMAIL_EXISTS');
        const code = (0, uuid_1.v4)();
        const options = JSON.stringify({ email: { on: true } });
        const checkEmail = process.env.LOGIN_CHECK_EMAIL === 'true';
        const statuses = email && checkEmail ? ['unconfirmed'] : ['registered'];
        const [{ id: user_id }] = yield db('users').insert({
            login, password: sha256(password + salt), salt, email, first_name, second_name, refresh: '', statuses, options,
        }).returning('*');
        ctx.body = yield loginTool({ ctx, login, password });
        if (checkEmail) {
            const recover = (0, uuid_1.v4)();
            yield db('code').insert({
                user_id, login, code, recover, time: new Date(),
            });
            mail.register(Object.assign({ code }, ctx.request.body));
        }
    });
}
function check(ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        const { login, code } = ctx.request.body;
        const { db } = ctx.state;
        if (!code || !login)
            return ctx.throw('WRONG_CODE');
        const expireIn = +process.env.LOGIN_CHECK_EMAIL_DELAY || 60;
        yield db('code').del().where('time', '>', new Date((new Date()).getTime() + 1000 * 60 * expireIn));
        yield db.raw('update code set attempts = attempts+1 where login=?', [login]);
        const data = yield db('code').where({ login, code }).where('attempts', '<', 3).first();
        if (!data)
            return ctx.throw('WRONG_CODE');
        const { user_id: id } = data;
        yield db('users').update({ statuses: ['registered'] }).where({ id });
        yield db('code').del().where({ login, code });
        ctx.body = yield loginTool({ ctx, id });
    });
}
function restore(ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        const { login, email } = ctx.request.body;
        const { db } = ctx.state;
        ctx.body = { ok: 1 };
        if (!login && !email)
            return;
        const where = login ? { login } : { email };
        const { email: to, login: l } = (yield db('users').where(Object.assign(Object.assign({}, where), { deleted: false })).first()) || {};
        if (!to)
            return;
        const code = (0, uuid_1.v4)();
        yield db('code').del().where({ login: l });
        yield db('code').insert({ login, recover: code });
        mail.recover({ email: to, code });
    });
}
function setPassword(ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        const { code, password } = ctx.request.body;
        const { db } = ctx.state;
        const expireIn = +process.env.LOGIN_CHECK_EMAIL_DELAY || 60;
        const expireTime = new Date((new Date()).getTime() - 1000 * 60 * expireIn);
        const { login } = (yield db('code').where({ recover: code }).where('time', '>', expireTime).first()) || {};
        if (!login)
            return ctx.throw('WRONG_CODE');
        yield db('code').del().where({ recover: code });
        const salt = (0, uuid_1.v4)();
        yield db('users').update({ password: sha256(password + salt), salt }).where({ login });
        ctx.body = { ok: 1 };
    });
}
function updateUser(ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        const { token, db } = ctx.state;
        const { email, first_name } = ctx.request.body;
        if (!token)
            return ctx.throw('NO_TOKEN');
        if (!token.id)
            return ctx.throw('TOKEN_INVALID');
        ctx.body = yield db('users').update({ email, first_name }).where({ id: token.id });
    });
}
function addStatus(ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        yield lib_1.checkAccess.userAccess(ctx, 'create status');
        const { db } = ctx.state;
        const { user_id, status_name } = ctx.params;
        if (['default', 'owner'].includes(status_name))
            return ctx.throw('FORBIDDEN_STATUS_NAME');
        const user = yield db('users').where({ id: user_id }).first();
        if (!user)
            return ctx.throw('USER_NOT_FOUND');
        const { statuses = [] } = user;
        if (!statuses.includes(status_name)) {
            statuses.push(status_name);
            ctx.body = yield db('users').update({ statuses }).where({ id: user_id });
        }
        ctx.body = statuses;
    });
}
function deleteStatus(ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        yield lib_1.checkAccess.userAccess(ctx, 'delete status');
        const { db } = ctx.state;
        const { user_id, status_name } = ctx.params;
        const user = yield db('users').where({ id: user_id }).first();
        if (!user)
            return ctx.throw('USER_NOT_FOUND');
        let { statuses = [] } = user;
        if (statuses.includes(status_name)) {
            statuses = statuses.filter((item) => item !== status_name);
            ctx.body = yield db('users').update({ statuses }).where({ id: user_id });
        }
        ctx.body = statuses;
    });
}
function setEmailTemplates(templates = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        for (const [key, value] of Object.entries(templates)) {
            mail.templates[`${key}`] = value;
        }
    });
}
function addFieldsToToken(...fields) {
    return __awaiter(this, void 0, void 0, function* () {
        tokenFields.concat(fields);
    });
}
exports.default = {
    loginHandler,
    externalLogin,
    register,
    check,
    restore,
    setPassword,
    updateUser,
    addStatus,
    deleteStatus,
    setEmailTemplates,
    addFieldsToToken,
};
