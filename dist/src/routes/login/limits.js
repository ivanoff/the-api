"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const loginLimits = { minute: 30, hour: 60, day: 240 };
exports.default = {
    'POST /login': loginLimits,
    'POST /register': loginLimits,
    'POST /login/forgot': loginLimits,
};
