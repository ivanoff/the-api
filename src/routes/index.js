const check = require('./check');
const login = require('./login');
const notes = require('./notes');
const discord = require('./login/external/discord');
const facebook = require('./login/external/facebook');
const github = require('./login/external/github');
const gitlab = require('./login/external/gitlab');
const google = require('./login/external/google');
const instagram = require('./login/external/instagram');
const linkedin = require('./login/external/linkedin');
const microsoft = require('./login/external/microsoft');
const slack = require('./login/external/slack');
const steam = require('./login/external/steam');
const twitter = require('./login/external/twitter');
const twitch = require('./login/external/twitch');
const oauth2 = require('./oauth2');

module.exports = {
  check,
  login,
  notes,
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
  twitch,
  oauth2,
};
