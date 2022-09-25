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
exports.destructor = exports.setLimits = void 0;
const redis = {
    total: {},
    minute: {},
    hour: {},
    day: {},
};
const intervals = [
    setInterval(() => { redis.minute = {}; }, 1000 * 60),
    setInterval(() => { redis.hour = {}; }, 1000 * 60 * 60),
    setInterval(() => { redis.day = {}; }, 1000 * 60 * 60 * 24),
];
let limits = {};
exports.default = (ctx, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { url, method, ip } = ctx.request;
    const { stack, token } = ctx.state;
    const { id, user_id } = token || {};
    const key = user_id || id || ip;
    const stat = Object.keys(redis).reduce((acc, type) => (Object.assign(Object.assign({}, acc), { [`${type}`]: redis[`${type}`][`${key}`] })), {});
    redis.total[`${key}`] = (redis.total[`${key}`] || 0) + 1;
    if (ctx.path === `${process.env.API_PREFIX || ''}/stats`) {
        ctx.body = { stat };
        return;
    }
    ctx.state.log('Check limits');
    const matchRequest = ({ methods, regexp }) => url.match(regexp) && methods.includes(method);
    const { path } = stack.filter(matchRequest).shift() || {};
    const methodPath = `${method} ${path}`;
    if (!limits[`${path}`] && !limits[`${methodPath}`])
        return next();
    for (const type of ['minute', 'hour', 'day']) {
        if (!redis[`${type}`][`${key}`])
            redis[`${type}`][`${key}`] = {};
        for (const p of [path, methodPath]) {
            const i = redis[`${type}`][`${key}`][`${p}`] || 0;
            if (limits[`${p}`] && i >= limits[`${p}`][`${type}`])
                throw new Error('LIMIT_EXCEEDED');
            redis[`${type}`][`${key}`][`${p}`] = i + 1;
        }
    }
    ctx.state.log(`Access was garanted for ${methodPath}`);
    yield next();
});
const setLimits = (a) => {
    limits = Object.assign(Object.assign({}, limits), a);
};
exports.setLimits = setLimits;
const destructor = () => {
    intervals.map(clearInterval);
};
exports.destructor = destructor;
