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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sleep = exports.Router = exports.relations = exports.Mail = exports.KoaKnexHelper = exports.getTablesInfo = exports.getSwaggerData = exports.getCode = exports.crud = exports.checkAccess = void 0;
const checkAccess = __importStar(require("./check_access"));
exports.checkAccess = checkAccess;
const crud_1 = __importDefault(require("./crud"));
exports.crud = crud_1.default;
const code_1 = __importDefault(require("./code"));
exports.getCode = code_1.default;
const swagger_1 = __importDefault(require("./swagger"));
exports.getSwaggerData = swagger_1.default;
const tables_info_1 = __importDefault(require("./tables_info"));
exports.getTablesInfo = tables_info_1.default;
const koa_knex_helper_1 = __importDefault(require("./koa_knex_helper"));
exports.KoaKnexHelper = koa_knex_helper_1.default;
const mail_1 = __importDefault(require("./mail"));
exports.Mail = mail_1.default;
const relations_1 = __importDefault(require("./relations"));
exports.relations = relations_1.default;
const router_1 = __importDefault(require("./router"));
exports.Router = router_1.default;
const sleep = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });
exports.sleep = sleep;
