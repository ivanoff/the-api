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
const simple_1 = __importDefault(require("./simple"));
const { npm_package_name: name, npm_package_version: version, } = process.env;
exports.default = (ctx, next) => __awaiter(void 0, void 0, void 0, function* () {
    const id = Math.random().toString(36).substring(2, 10);
    ctx.state = Object.assign(Object.assign({}, ctx.state), { id, name, version });
    ctx.state.log = (0, simple_1.default)(ctx);
    const params = yield ctx.params;
    const { ip, query, files, body: bodyOrigin, } = ctx.request;
    const body = Object.assign({}, bodyOrigin);
    if (body.password)
        body.password = '<hidden>';
    const headers = Object.assign({}, ctx.headers);
    if (headers.authorization)
        headers.authorization = '<hidden>';
    ctx.state.log('start', {
        ip, params, query, headers, body, files,
    });
    yield next();
    const result = Object.assign({}, ctx.body);
    if (result.token)
        result.token = '<hidden>';
    if (result.refresh)
        result.refresh = '<hidden>';
    ctx.state.log(ctx.response, result, 'end');
});
