"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const main_1 = __importDefault(require("./errors/main"));
const token_1 = __importDefault(require("./errors/token"));
exports.default = Object.assign(Object.assign({}, main_1.default), token_1.default);
