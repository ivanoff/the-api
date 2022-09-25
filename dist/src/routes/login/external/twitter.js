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
const twitter_api_v2_1 = require("twitter-api-v2");
const controller_1 = __importDefault(require("../controller"));
const service = 'twitter';
const { AUTH_TWITTER_APP_KEY: appKey, AUTH_TWITTER_APP_SECRET: appSecret, AUTH_TWITTER_CALLBACK_URL: callbackURL, } = process.env;
const oauthTokens = {};
exports.default = (api) => __awaiter(void 0, void 0, void 0, function* () {
    return api.router()
        .tag('users')
        .prefix(`/login/${service}`)
        .get('/', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
        const client = new twitter_api_v2_1.TwitterApi({ appKey, appSecret });
        const { url, oauth_token, oauth_token_secret } = yield client.generateAuthLink(callbackURL);
        oauthTokens[`${oauth_token}`] = oauth_token_secret;
        setTimeout(() => delete oauthTokens[`${oauth_token}`], 1000 * 60 * 30);
        ctx.body = '';
        ctx.redirect(url);
    }))
        .post('/', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
        const { oauth_token, oauth_verifier } = ctx.query;
        const storedAccessSecret = oauthTokens[`${oauth_token}`];
        if (!storedAccessSecret)
            return ctx.redirect(`/login/${service}`);
        const tempClient = new twitter_api_v2_1.TwitterApi({
            appKey, appSecret, accessToken: oauth_token, accessSecret: storedAccessSecret,
        });
        const { accessToken, accessSecret } = yield tempClient.login(oauth_verifier);
        const client = new twitter_api_v2_1.TwitterApi({
            appKey, appSecret, accessToken, accessSecret,
        });
        const profileRaw = yield client.currentUser();
        const profile = Object.assign(Object.assign({}, profileRaw), { provider: service });
        const { id: external_id, name: first_name, screen_name: userName, } = profile;
        yield controller_1.default.externalLogin({
            ctx, service, profile, external_id, first_name, email: `${userName}@${service}`,
        });
    }));
});
