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
const list_1 = __importDefault(require("./list"));
const url = 'https://server/api/errors';
exports.default = (ctx, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        ctx.throw = (err) => {
            throw new Error(err);
        };
        yield next();
        if (ctx.status === 404 && !ctx.body)
            throw new Error('API_METHOD_NOT_FOUND');
    }
    catch (errorObj) {
        const { message: codeName, stack } = errorObj;
        const { name, version, routeErrors } = ctx.state;
        const errorListed = routeErrors[`${codeName}`] || list_1.default[`${codeName}`];
        const error = errorListed || list_1.default.DEFAULT_ERROR;
        if (errorListed && !error.url)
            error.url = `${url}#${codeName}`;
        error.developerMessage = {
            name, version, codeName, stack,
        };
        const { code, name: errorName, description } = error;
        ctx.status = error.status || 500;
        ctx.body = { code, name: errorName, description };
        ctx.state.log(error);
    }
});
