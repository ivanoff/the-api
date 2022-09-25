"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const check_1 = __importDefault(require("./check"));
const login_1 = __importStar(require("./login")), loginHandler = login_1;
const notes_1 = __importDefault(require("./notes"));
const discord_1 = __importDefault(require("./login/external/discord"));
const facebook_1 = __importDefault(require("./login/external/facebook"));
const github_1 = __importDefault(require("./login/external/github"));
const gitlab_1 = __importDefault(require("./login/external/gitlab"));
const google_1 = __importDefault(require("./login/external/google"));
const instagram_1 = __importDefault(require("./login/external/instagram"));
const linkedin_1 = __importDefault(require("./login/external/linkedin"));
const microsoft_1 = __importDefault(require("./login/external/microsoft"));
const slack_1 = __importDefault(require("./login/external/slack"));
const steam_1 = __importDefault(require("./login/external/steam"));
const twitter_1 = __importDefault(require("./login/external/twitter"));
exports.default = {
    check: check_1.default,
    login: login_1.default,
    loginHandler,
    notes: notes_1.default,
    discord: discord_1.default,
    facebook: facebook_1.default,
    github: github_1.default,
    gitlab: gitlab_1.default,
    google: google_1.default,
    instagram: instagram_1.default,
    linkedin: linkedin_1.default,
    microsoft: microsoft_1.default,
    slack: slack_1.default,
    steam: steam_1.default,
    twitter: twitter_1.default,
};
