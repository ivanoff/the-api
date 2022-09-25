"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lib_1 = require("../../lib");
const controller_1 = __importDefault(require("./controller"));
const router = new lib_1.Router();
exports.default = router
    .tag('users')
    .post('/register', controller_1.default.register, {
    summary: 'Register new user',
    schema: {
        login: 'string',
        password: 'string',
        first_name: 'string',
        second_name: 'string',
        email: 'string',
    },
})
    .post('/register/check', controller_1.default.check, {
    summary: 'Check',
    schema: {
        login: 'string',
        code: 'string',
    },
})
    .post('/login', controller_1.default.loginHandler, {
    summary: 'Get jwt token',
    schema: {
        login: 'string',
        password: 'string',
    },
    responses: ['USER_NOT_FOUND', 'EMAIL_NOT_CONFIRMED'],
})
    .post('/login/refresh', controller_1.default.loginHandler, {
    summary: 'Refresh jwt token',
    schema: {
        refresh: 'string',
    },
    responses: ['USER_NOT_FOUND', 'EMAIL_NOT_CONFIRMED'],
})
    .post('/login/forgot', controller_1.default.restore, {
    summary: 'Get token to restore password',
    schema: {
        login: 'string',
    },
})
    .post('/login/restore', controller_1.default.setPassword, {
    summary: 'Set new password by restore code',
    schema: {
        code: 'string',
        password: 'string',
    },
})
    .patch('/login', controller_1.default.updateUser, {
    summary: 'Update user',
    tokenRequired: true,
    schema: {
        code: 'string',
        password: 'string',
    },
})
    .post('/users/:user_id/statuses/:status_name', controller_1.default.addStatus, {
    tokenRequired: true,
    summary: `Create status`,
})
    .delete('/users/:user_id/statuses/:status_name', controller_1.default.deleteStatus, {
    tokenRequired: true,
    summary: 'Delete status',
});
