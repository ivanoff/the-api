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
const nodemailer_1 = __importDefault(require("nodemailer"));
require("dotenv/config");
const { EMAIL_USER: user, EMAIL_PASSWORD: pass, EMAIL_HOST: host, EMAIL_PORT: port, EMAIL_SECURE: isSecure, EMAIL_TLS_REJECTUNAUTH: rejectUnauth, } = process.env;
const auth = { user, pass };
const secure = isSecure && isSecure === 'true';
const tls = rejectUnauth && { rejectUnauthorized: rejectUnauth === 'true' };
class Mail {
    constructor(options) {
        this.config = options || {
            auth, host, port, secure, tls,
        };
        this.transport = nodemailer_1.default.createTransport(this.config);
        this.message = {
            from: this.config.auth.user,
        };
    }
    send({ email: to, subject, text, html, }) {
        return __awaiter(this, void 0, void 0, function* () {
            const message = Object.assign(Object.assign({}, this.message), { to, subject, text, html });
            return new Promise((resolve, reject) => {
                this.transport.sendMail(message, (err, info) => (err ? reject(err) : resolve(info)));
            });
        });
    }
}
exports.default = Mail;
