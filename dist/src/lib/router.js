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
const crypto = __importStar(require("crypto"));
const router_1 = __importDefault(require("@koa/router"));
const redis = {};
const getWithCache = (cb, timeoutOrigin = 5) => {
    const timeout = +timeoutOrigin * 1000;
    return (ctx, next, ...other) => __awaiter(void 0, void 0, void 0, function* () {
        const { method, url, request } = ctx;
        const params = JSON.stringify(yield ctx.params);
        const query = JSON.stringify(request.query);
        const md5sum = crypto.createHash('md5').update(method + url + params + query);
        const key = md5sum.digest('hex');
        if (redis[`${key}`]) {
            ctx.state.log(`Get data from cache by key ${key}`);
            ctx.body = redis[`${key}`];
        }
        else {
            ctx.state.log(`Store data in cache for ${timeout}ms`);
            yield cb(ctx, next, ...other);
            redis[`${key}`] = ctx.body;
            ((eraseKey) => setTimeout(() => delete redis[`${eraseKey}`], timeout))(key);
        }
    });
};
class RouterHandler extends router_1.default {
    constructor(opt = {}) {
        super(opt);
        this._prefix = (opt === null || opt === void 0 ? void 0 : opt.prefix) || '';
        this._tokenRequired = false;
        this.swagger = {};
        this.currentTag = 'default';
    }
    prefix(prefix, ...p) {
        this._prefix = `/${prefix}${this._prefix}`;
        this._prefix = this._prefix.replace(/\/+/g, '/').replace(/\/+$/, '');
        return super.prefix(prefix, ...p);
    }
    tokenRequired() {
        this._tokenRequired = true;
        return this;
    }
    tag(tagName) {
        this.currentTag = tagName;
        return this;
    }
    responseSchema(schemaName) {
        this.currentSchema = schemaName;
        return this;
    }
    _h(t) {
        return (q) => {
            const [path, cbOrigin, middleWare, options] = q;
            const hasMiddleware = typeof middleWare === 'function';
            let o = hasMiddleware ? options : middleWare;
            const cb = (t === 'get' && (o === null || o === void 0 ? void 0 : o.cache)) ? getWithCache(cbOrigin, o === null || o === void 0 ? void 0 : o.cache) : cbOrigin;
            if (!(o === null || o === void 0 ? void 0 : o.tag))
                o = Object.assign(Object.assign({}, o), { tag: this.currentTag });
            if (this.currentSchema)
                o = Object.assign(Object.assign({}, o), { currentSchema: this.currentSchema });
            if (this._tokenRequired)
                o = Object.assign(Object.assign({}, o), { tokenRequired: this._tokenRequired });
            const p = `${this._prefix}${path}`.replace(/\/+$/, '') || '/';
            const current = this.swagger[`${p}`] || {};
            this.swagger[`${p}`] = Object.assign(Object.assign({}, current), { [t]: o });
            return hasMiddleware ? super[`${t}`](path, cb, middleWare) : super[`${t}`](path, cb);
        };
    }
    get(...p) { return this._h('get')(p); }
    post(...p) { return this._h('post')(p); }
    put(...p) { return this._h('put')(p); }
    patch(...p) { return this._h('patch')(p); }
    del(...p) { return this._h('del')(p); }
    delete(...p) { return this._h('delete')(p); }
    all(...p) { return this._h('all')(p); }
}
exports.default = RouterHandler;
