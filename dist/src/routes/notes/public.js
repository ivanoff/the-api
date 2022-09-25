"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lib_1 = require("../../lib");
const controller_1 = __importDefault(require("./controller"));
const router = new lib_1.Router();
exports.default = router
    .tag('notes')
    .get('/notes/public', controller_1.default.getPublicCategories)
    .get('/notes/public/:id', controller_1.default.getSinglePublicCategory)
    .get('/notes/public/:id/data', controller_1.default.getPublicData);
