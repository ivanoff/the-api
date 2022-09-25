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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
const lib_1 = require("../../lib");
class LoginMail extends lib_1.Mail {
    constructor(opt) {
        super(opt);
        this.templates = {
            register: {
                subject: 'Complete your registration',
                text: 'Hello, use your code {{code}} to POST /register/check',
                html: 'Hello, use your <b>code {{code}}</b> to POST <b>/register/check</b>',
            },
            recover: {
                subject: 'Recover you password',
                text: 'Hello, use your recover {{code}}</b> and new password to POST /login/restore',
                html: 'Hello, use your <b>recover {{code}}</b> and new <b>password<b> to POST <b>/register/restore</b>',
            },
        };
    }
    getPreparedData(templateName = '', params = {}) {
        const template = this.templates[`${templateName}`] || {};
        const result = Object.assign({}, template);
        for (const key of Object.keys(result)) {
            for (const [name, replace] of Object.entries(params)) {
                const r = new RegExp(`\\{\\{${name}\\}\\}`, 'g');
                result[`${key}`] = result[`${key}`].replace(r, replace);
            }
        }
        return result;
    }
    register(_a) {
        var { email } = _a, params = __rest(_a, ["email"]);
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.send(Object.assign({ email }, this.getPreparedData('register', params)));
            }
            catch (err) {
                console.error(err);
            }
        });
    }
    recover(_a) {
        var { email } = _a, params = __rest(_a, ["email"]);
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.send(Object.assign({ email }, this.getPreparedData('recover', params)));
            }
            catch (err) {
                console.error(err);
            }
        });
    }
}
exports.default = LoginMail;
