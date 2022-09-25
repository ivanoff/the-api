"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lib_1 = require("../../lib");
const router = new lib_1.Router();
const swagger = { examples: { 'curl localhost:8877/check': { ok: 1 } } };
exports.default = router.tag('system').get('/check', (ctx) => { ctx.body = { ok: 1 }; }, swagger);
