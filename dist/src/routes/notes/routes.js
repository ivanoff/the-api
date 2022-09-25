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
    .get('/notes', controller_1.default.getAllCategories)
    .post('/notes', controller_1.default.createCategory)
    .get('/notes/:id', controller_1.default.getSingleCategory)
    .patch('/notes/:id', controller_1.default.updateCategory)
    .delete('/notes/:id', controller_1.default.deleteSingleCategory)
    .get('/notes/:id/data', controller_1.default.getAllData)
    .post('/notes/:id/data', controller_1.default.createData)
    .delete('/notes/:id/data', controller_1.default.deleteAllData)
    .get('/notes/:id/data/:dataId', controller_1.default.getSingleData)
    .delete('/notes/:id/data/:dataId', controller_1.default.deleteSingleData);
