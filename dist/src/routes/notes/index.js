"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.migration = exports.errors = exports.public = void 0;
const routes_1 = __importDefault(require("./routes"));
const public_1 = __importDefault(require("./public"));
exports.public = public_1.default;
const errors_1 = __importDefault(require("./errors"));
exports.errors = errors_1.default;
const migration = `${__dirname}/migrations`;
exports.migration = migration;
exports.default = routes_1.default;
