"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    USER_NOT_FOUND: {
        code: 1030,
        status: 404,
        name: 'User Not Found',
        description: 'User not found. Please send correct login and password',
    },
    EMAIL_NOT_CONFIRMED: {
        code: 1031,
        status: 401,
        name: 'Email Not Confirmed',
        description: 'Email not confirmed. Please, check your incoming mail folder for confirm link',
    },
    LOGIN_EXISTS: {
        code: 1032,
        status: 409,
        name: 'Login exists',
        description: 'Login exists. Please enter another login',
    },
    EMAIL_EXISTS: {
        code: 1033,
        status: 409,
        name: 'Email exists',
        description: 'Email exists in database. Please enter another email',
    },
    WRONG_CODE: {
        code: 1034,
        status: 409,
        name: 'Wrong Code',
        description: 'Code you provide was wrong. Please try with another one or reset you password',
    },
    LOGIN_REQUIRED: {
        code: 1035,
        status: 409,
        name: 'Login required',
        description: 'Login required. Please enter login',
    },
};
