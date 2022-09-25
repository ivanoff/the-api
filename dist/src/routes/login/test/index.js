"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("mocha");
const chai_1 = require("chai");
const fetch_1 = require("../../../../test/lib/fetch");
const index_1 = __importDefault(require("../../../index"));
describe('Login', () => {
    let api;
    const env = Object.assign({}, process.env);
    const userData = { login: 'aaa15', password: 'bbb', email: '3@ivanoff.org.ua' };
    before(() => __awaiter(void 0, void 0, void 0, function* () {
        process.env = Object.assign(Object.assign({}, process.env), { LOGIN_CHECK_EMAIL: 'true' });
        api = new index_1.default();
        yield api.up([api.extensions.errors, api.routes.login]);
    }));
    after(() => __awaiter(void 0, void 0, void 0, function* () {
        process.env = env;
        yield api.down();
    }));
    describe('Register', () => {
        let res;
        let code;
        const { login, password } = userData;
        it('status 200', () => __awaiter(void 0, void 0, void 0, function* () {
            res = yield (0, fetch_1.post)('/register', userData);
            (0, chai_1.expect)(res.status).to.eql(200);
        }));
        it('status 409 for same login', () => __awaiter(void 0, void 0, void 0, function* () {
            res = yield (0, fetch_1.post)('/register', Object.assign(Object.assign({}, userData), { email: 'wrong' }));
            (0, chai_1.expect)(res.status).to.eql(409);
        }));
        it('status 409 for same email', () => __awaiter(void 0, void 0, void 0, function* () {
            res = yield (0, fetch_1.post)('/register', Object.assign(Object.assign({}, userData), { login: 'wrong' }));
            (0, chai_1.expect)(res.status).to.eql(409);
        }));
        it('status 200', () => __awaiter(void 0, void 0, void 0, function* () {
            res = yield (0, fetch_1.post)('/login', { login, password });
            (0, chai_1.expect)(res.status).to.eql(200);
        }));
        it('email has `to` property', () => __awaiter(void 0, void 0, void 0, function* () {
            (0, chai_1.expect)(global.message).to.have.property('to');
        }));
        it('email `to` contains right email address', () => __awaiter(void 0, void 0, void 0, function* () {
            (0, chai_1.expect)(global.message.to).to.eql(userData.email);
        }));
        it('email has `text` property', () => __awaiter(void 0, void 0, void 0, function* () {
            (0, chai_1.expect)(global.message).to.have.property('text');
        }));
        it('email `text` contains code', () => __awaiter(void 0, void 0, void 0, function* () {
            const match = global.message.text.match(/\b([\da-f-]{36})\b/);
            [, code] = match;
            (0, chai_1.expect)(!!code).to.eql(true);
        }));
        it('check code with no login returns status 409', () => __awaiter(void 0, void 0, void 0, function* () {
            res = yield (0, fetch_1.post)('/register/check', { code });
            (0, chai_1.expect)(res.status).to.eql(409);
        }));
        it('check code returns status 200', () => __awaiter(void 0, void 0, void 0, function* () {
            res = yield (0, fetch_1.post)('/register/check', { login, code });
            (0, chai_1.expect)(res.status).to.eql(200);
        }));
        it('check code again returns status 409', () => __awaiter(void 0, void 0, void 0, function* () {
            res = yield (0, fetch_1.post)('/register/check', { login, code });
            (0, chai_1.expect)(res.status).to.eql(409);
        }));
    });
    describe('Login', () => {
        let res;
        const { login, password } = userData;
        it('status 200', () => __awaiter(void 0, void 0, void 0, function* () {
            res = yield (0, fetch_1.post)('/login', { login, password });
            (0, chai_1.expect)(res.status).to.eql(200);
        }));
    });
    describe('Use refresh', () => {
        let res;
        let token;
        let refresh;
        let secondRefresh;
        const { login, password } = userData;
        it('has refresh', () => __awaiter(void 0, void 0, void 0, function* () {
            const rawRes = yield (0, fetch_1.post)('/login', { login, password });
            res = yield rawRes.json();
            (0, chai_1.expect)(res).to.have.property('refresh');
            refresh = res.refresh;
        }));
        it('has token', () => __awaiter(void 0, void 0, void 0, function* () {
            (0, chai_1.expect)(res).to.have.property('token');
            token = res.token;
        }));
        it('refresh is looks like uuid', () => __awaiter(void 0, void 0, void 0, function* () {
            (0, chai_1.expect)(refresh.split('-')).to.have.lengthOf(5);
        }));
        it('token is looks like jwt', () => __awaiter(void 0, void 0, void 0, function* () {
            (0, chai_1.expect)(token.split('.')).to.have.lengthOf(3);
        }));
        it('get new refresh', () => __awaiter(void 0, void 0, void 0, function* () {
            res = yield (0, fetch_1.post)('/login', { refresh });
            (0, chai_1.expect)(res.status).to.eql(200);
        }));
        it('new refresh is equal to the old one in case of using refresh token', () => __awaiter(void 0, void 0, void 0, function* () {
            secondRefresh = (yield res.json()).refresh;
            (0, chai_1.expect)(secondRefresh).to.eql(refresh);
        }));
        it('new refresh is looks like uuid', () => __awaiter(void 0, void 0, void 0, function* () {
            (0, chai_1.expect)(secondRefresh.split('-')).to.have.lengthOf(5);
        }));
        it('Old refresh token does work', () => __awaiter(void 0, void 0, void 0, function* () {
            res = yield (0, fetch_1.post)('/login', { refresh });
            (0, chai_1.expect)(res.status).to.eql(200);
        }));
        it('New refresh token works', () => __awaiter(void 0, void 0, void 0, function* () {
            res = yield (0, fetch_1.post)('/login', { refresh: secondRefresh });
            (0, chai_1.expect)(res.status).to.eql(200);
        }));
    });
    describe('Restore password', () => {
        let res;
        let code;
        const { login, password, email } = userData;
        const newPassword = `${password}-${password}`;
        it('status 200 for any request', () => __awaiter(void 0, void 0, void 0, function* () {
            const rawRes = yield (0, fetch_1.post)('/login/forgot', {});
            (0, chai_1.expect)(rawRes.status).to.eql(200);
            res = yield rawRes.json();
        }));
        it('any request is ok', () => __awaiter(void 0, void 0, void 0, function* () {
            (0, chai_1.expect)(res).to.have.property('ok');
        }));
        it('response for any request ok is 1', () => __awaiter(void 0, void 0, void 0, function* () {
            (0, chai_1.expect)(res.ok).to.eql(1);
        }));
        it('status 200 for wrong request', () => __awaiter(void 0, void 0, void 0, function* () {
            const rawRes = yield (0, fetch_1.post)('/login/forgot', { login: 'wrong' });
            (0, chai_1.expect)(rawRes.status).to.eql(200);
            res = yield rawRes.json();
        }));
        it('wrong request is ok', () => __awaiter(void 0, void 0, void 0, function* () {
            (0, chai_1.expect)(res).to.have.property('ok');
        }));
        it('response for wrong request ok is 1', () => __awaiter(void 0, void 0, void 0, function* () {
            (0, chai_1.expect)(res.ok).to.eql(1);
        }));
        it('status 200', () => __awaiter(void 0, void 0, void 0, function* () {
            const rawRes = yield (0, fetch_1.post)('/login/forgot', { login });
            (0, chai_1.expect)(rawRes.status).to.eql(200);
            res = yield rawRes.json();
        }));
        it('response is ok', () => __awaiter(void 0, void 0, void 0, function* () {
            (0, chai_1.expect)(res).to.have.property('ok');
        }));
        it('response ok is 1', () => __awaiter(void 0, void 0, void 0, function* () {
            (0, chai_1.expect)(res.ok).to.eql(1);
        }));
        it('email has `to` property', () => __awaiter(void 0, void 0, void 0, function* () {
            (0, chai_1.expect)(global.message).to.have.property('to');
        }));
        it('email `to` contains right email address', () => __awaiter(void 0, void 0, void 0, function* () {
            (0, chai_1.expect)(global.message.to).to.eql(userData.email);
        }));
        it('email has `text` property', () => __awaiter(void 0, void 0, void 0, function* () {
            (0, chai_1.expect)(global.message).to.have.property('text');
        }));
        it('email `text` contains code', () => __awaiter(void 0, void 0, void 0, function* () {
            const match = global.message.text.match(/\b([\da-f-]{36})\b/);
            [, code] = match;
            (0, chai_1.expect)(!!code).to.eql(true);
        }));
        it('set new password with wrong code', () => __awaiter(void 0, void 0, void 0, function* () {
            const rawRes = yield (0, fetch_1.post)('/login/restore', { code: 'wrong', password: newPassword });
            (0, chai_1.expect)(rawRes.status).to.eql(409);
        }));
        it('set new password', () => __awaiter(void 0, void 0, void 0, function* () {
            const rawRes = yield (0, fetch_1.post)('/login/restore', { code, password: newPassword });
            (0, chai_1.expect)(rawRes.status).to.eql(200);
            res = yield rawRes.json();
        }));
        it('try to login with old password result 404', () => __awaiter(void 0, void 0, void 0, function* () {
            const rawRes = yield (0, fetch_1.post)('/login', { login, password });
            (0, chai_1.expect)(rawRes.status).to.eql(404);
        }));
        it('login with new password result has refresh', () => __awaiter(void 0, void 0, void 0, function* () {
            const rawRes = yield (0, fetch_1.post)('/login', { login, password: newPassword });
            (0, chai_1.expect)(rawRes.status).to.eql(200);
            res = yield rawRes.json();
            (0, chai_1.expect)(res).to.have.property('refresh');
        }));
        it('try to restore with email 200 status code', () => __awaiter(void 0, void 0, void 0, function* () {
            const rawRes = yield (0, fetch_1.post)('/login/forgot', { email });
            (0, chai_1.expect)(rawRes.status).to.eql(200);
            res = yield rawRes.json();
        }));
        it('email `text` contains code', () => __awaiter(void 0, void 0, void 0, function* () {
            const match = global.message.text.match(/\b([\da-f-]{36})\b/);
            [, code] = match;
            (0, chai_1.expect)(!!code).to.eql(true);
        }));
        it('try to restore with old code', () => __awaiter(void 0, void 0, void 0, function* () {
            const rawRes = yield (0, fetch_1.post)('/login/forgot', { email });
            res = yield rawRes.json();
            const rawRes2 = yield (0, fetch_1.post)('/login/restore', { code, password: newPassword });
            (0, chai_1.expect)(rawRes2.status).to.eql(409);
        }));
    });
    describe('Update user data', () => {
        const userData2 = { login: 'aaa8', password: 'bbb' };
        const { login, password } = userData2;
        let res;
        let token;
        it('status 200', () => __awaiter(void 0, void 0, void 0, function* () {
            res = yield (0, fetch_1.post)('/register', userData2);
            (0, chai_1.expect)(res.status).to.eql(200);
        }));
        it('has refresh', () => __awaiter(void 0, void 0, void 0, function* () {
            const rawRes = yield (0, fetch_1.post)('/login', { login, password });
            res = yield rawRes.json();
            token = res.token;
        }));
        it('change first name', () => __awaiter(void 0, void 0, void 0, function* () {
            res = yield (0, fetch_1.patch)('/login', { first_name: 'aaa' }, { Authorization: `Bearer ${token}` });
            (0, chai_1.expect)(res).to.have.property('ok');
        }));
        it('change email', () => __awaiter(void 0, void 0, void 0, function* () {
            res = yield (0, fetch_1.patch)('/login', { email: 'bbb' }, { Authorization: `Bearer ${token}` });
            (0, chai_1.expect)(res).to.have.property('ok');
        }));
        it('has refresh', () => __awaiter(void 0, void 0, void 0, function* () {
            const rawRes = yield (0, fetch_1.post)('/login', { login, password });
            res = yield rawRes.json();
            (0, chai_1.expect)(res.first_name).to.eql('aaa');
            (0, chai_1.expect)(res.email).to.eql('bbb');
        }));
    });
    describe('Mistakes', () => {
        let res;
        it('status 404', () => __awaiter(void 0, void 0, void 0, function* () {
            res = yield (0, fetch_1.post)('/login', { login: 'wrong', password: 'bbb' });
            (0, chai_1.expect)(res.status).to.eql(404);
        }));
        it('status 404', () => __awaiter(void 0, void 0, void 0, function* () {
            res = yield (0, fetch_1.post)('/login', {});
            (0, chai_1.expect)(res.status).to.eql(404);
        }));
        it('status 409', () => __awaiter(void 0, void 0, void 0, function* () {
            res = yield (0, fetch_1.post)('/register', { login: '' });
            (0, chai_1.expect)(res.status).to.eql(409);
        }));
    });
});
