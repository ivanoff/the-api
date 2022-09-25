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
exports.del = exports.patch = exports.post = exports.get = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const site = 'http://localhost:8877';
const defaultHeaders = { 'Content-Type': 'application/json' };
const get = (url, headers = {}) => (0, node_fetch_1.default)(site + url, { headers });
exports.get = get;
const post = (url, data, headers = {}) => __awaiter(void 0, void 0, void 0, function* () { return (0, node_fetch_1.default)(site + url, { method: 'POST', headers: Object.assign(Object.assign({}, defaultHeaders), headers), body: data && JSON.stringify(data) }); });
exports.post = post;
const patch = (url, data, headers = {}) => __awaiter(void 0, void 0, void 0, function* () { return (0, node_fetch_1.default)(site + url, { method: 'PATCH', headers: Object.assign(Object.assign({}, defaultHeaders), headers), body: data && JSON.stringify(data) }); });
exports.patch = patch;
const del = (url, headers = {}) => __awaiter(void 0, void 0, void 0, function* () { return (0, node_fetch_1.default)(site + url, { method: 'DELETE', headers }); });
exports.del = del;
