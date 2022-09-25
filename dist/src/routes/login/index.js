"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addFieldsToToken = exports.setEmailTemplates = exports.limits = exports.errors = void 0;
const routes_1 = __importDefault(require("./routes"));
const errors_1 = __importDefault(require("./errors"));
exports.errors = errors_1.default;
const limits_1 = __importDefault(require("./limits"));
exports.limits = limits_1.default;
const controller_1 = __importDefault(require("./controller"));
const setEmailTemplates = controller_1.default.setEmailTemplates;
exports.setEmailTemplates = setEmailTemplates;
const addFieldsToToken = controller_1.default.addFieldsToToken;
exports.addFieldsToToken = addFieldsToToken;
exports.default = routes_1.default;
