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
const passport_discord_1 = require("passport-discord");
const controller_1 = __importDefault(require("../controller"));
const service = 'discord';
const { AUTH_DISCORD_CLIENT_ID: clientID, AUTH_DISCORD_CLIENT_SECRET: clientSecret, AUTH_DISCORD_CALLBACK_URL: callbackURL, } = process.env;
exports.default = (api) => __awaiter(void 0, void 0, void 0, function* () {
    api.passport.use(new passport_discord_1.Strategy({
        clientID, clientSecret, callbackURL, scope: ['identify', 'email', 'guilds', 'guilds.join'],
    }, (token, refresh, profile, done) => done(null, { token, refresh, profile })));
    return api.router()
        .tag('users')
        .get(`/login/${service}`, api.passport.authenticate(service))
        .post(`/login/${service}`, (ctx) => __awaiter(void 0, void 0, void 0, function* () {
        const { profile } = yield new Promise((resolve, reject) => {
            api.passport.authenticate(service, (err, res) => (err ? reject(err) : resolve(res)))(ctx);
        });
        const { id: external_id, username: first_name, email, } = profile;
        yield controller_1.default.externalLogin({
            ctx, service, profile, external_id, first_name, email,
        });
    }));
});
