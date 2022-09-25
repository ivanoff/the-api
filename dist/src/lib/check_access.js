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
Object.defineProperty(exports, "__esModule", { value: true });
exports.userAccess = exports.statusRequired = exports.rootRequired = exports.checkRootToken = exports.ownerRequired = exports.checkOwnerToken = exports.tokenRequired = exports.checkToken = void 0;
function checkToken(ctx) {
    if (!ctx.state.token)
        ctx.throw('NO_TOKEN');
}
exports.checkToken = checkToken;
function tokenRequired(ctx, next) {
    return __awaiter(this, void 0, void 0, function* () {
        checkToken(ctx);
        yield next();
    });
}
exports.tokenRequired = tokenRequired;
function checkOwnerToken(ctx) {
    var _a;
    checkToken(ctx);
    if (!((_a = ctx.params) === null || _a === void 0 ? void 0 : _a.user_id))
        ctx.throw('USER_NOT_FOUND');
    if (ctx.state.token.id !== +ctx.params.user_id)
        ctx.throw('OWNER_REQUIRED');
}
exports.checkOwnerToken = checkOwnerToken;
function ownerRequired(ctx, next) {
    return __awaiter(this, void 0, void 0, function* () {
        checkOwnerToken(ctx);
        yield next();
    });
}
exports.ownerRequired = ownerRequired;
function checkRootToken(ctx) {
    const { login, statuses } = ctx.state.token || {};
    const rootMode = login === 'root' && (statuses === null || statuses === void 0 ? void 0 : statuses.includes('root'));
    if (!rootMode)
        ctx.throw('TOKEN_INVALID');
}
exports.checkRootToken = checkRootToken;
function rootRequired(ctx, next) {
    return __awaiter(this, void 0, void 0, function* () {
        checkRootToken(ctx);
        yield next();
    });
}
exports.rootRequired = rootRequired;
function statusRequired(statuses = [], ...restStatuses) {
    return (ctx, next) => __awaiter(this, void 0, void 0, function* () {
        checkToken(ctx);
        const { statuses: tokenStatuses } = ctx.state.token || {};
        const s = [].concat(statuses, restStatuses).filter(Boolean);
        if (s.length && !s.some((item) => tokenStatuses.includes(item)))
            ctx.throw('STATUS_INVALID');
        yield next();
    });
}
exports.statusRequired = statusRequired;
function userAccess(ctx, name) {
    return __awaiter(this, void 0, void 0, function* () {
        checkToken(ctx);
        const { statuses: tokenStatuses } = ctx.state.token || {};
        const s = ctx.state.userAccess && ctx.state.userAccess[`${name}`];
        if (s && !s.some((item) => tokenStatuses.includes(item)))
            ctx.throw('USER_ACCESS_DENIED');
    });
}
exports.userAccess = userAccess;
