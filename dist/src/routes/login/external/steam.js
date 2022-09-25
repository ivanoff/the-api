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
const passport_steam_1 = __importDefault(require("passport-steam"));
const controller_1 = __importDefault(require("../controller"));
const service = 'steam';
const { AUTH_STEAM_RETURN_URL: returnURL, AUTH_STEAM_REALM: realm, AUTH_STEAM_API_KEY: apiKey, } = process.env;
exports.default = (api) => __awaiter(void 0, void 0, void 0, function* () {
    api.passport.use(new passport_steam_1.default({
        returnURL, realm, apiKey,
    }, (token, refresh, profile, done) => done(null, { token, refresh, profile })));
    return api.router()
        .tag('users')
        .get(`/login/${service}`, api.passport.authenticate(service))
        .post(`/login/${service}`, (ctx) => __awaiter(void 0, void 0, void 0, function* () {
        const { profile } = yield new Promise((resolve, reject) => {
            api.passport.authenticate(service, (err, res) => (err ? reject(err) : resolve(res)))(ctx);
        });
        const { id: external_id, given_name: first_name, family_name: second_name, email, } = profile._json;
        yield controller_1.default.externalLogin({
            ctx, service, profile, external_id, first_name, second_name, email,
        });
    }));
});
