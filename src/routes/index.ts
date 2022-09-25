import check from './check';
import login, * as loginHandler from './login';
import discord from './login/external/discord';
import facebook from './login/external/facebook';
import github from './login/external/github';
import gitlab from './login/external/gitlab';
import google from './login/external/google';
import instagram from './login/external/instagram';
import linkedin from './login/external/linkedin';
import microsoft from './login/external/microsoft';
import slack from './login/external/slack';
import steam from './login/external/steam';
import twitter from './login/external/twitter';

export default {
  check,
  login,
  loginHandler,
  discord,
  facebook,
  github,
  gitlab,
  google,
  instagram,
  linkedin,
  microsoft,
  slack,
  steam,
  twitter,
};
