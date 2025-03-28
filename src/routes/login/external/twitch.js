const { Strategy } = require('passport-twitch-new');
const c = require('../controller');

const service = 'twitch';

const {
  AUTH_TWITCH_CLIENT_ID: clientID,
  AUTH_TWITCH_CLIENT_SECRET: clientSecret,
  AUTH_TWITCH_CALLBACK_URL: callbackURL,
} = process.env;

module.exports = async (api) => {
  if (!clientID || !clientSecret || !callbackURL) return;

  api.passport.use(
    new Strategy(
      {
        clientID, clientSecret, callbackURL, scope: 'user_read',
      },
      (token, refresh, profile, done) => done(null, { token, refresh, profile }),
    ),
  );

  return api.router()
    .tag('users')
    .get(`/login/${service}`, api.passport.authenticate(service))
    .post(
      `/login/${service}`,
      async (ctx) => {
        const { profile } = await new Promise((resolve, reject) => {
          api.passport.authenticate(service, (err, res) => (err ? reject(err) : resolve(res)))(ctx);
        });
        const {
          id: externalId,
          display_name: firstName,
          email,
        } = profile;

        await c.externalLogin({
          ctx, service, profile, externalId, firstName, email,
        });
      },
    );
};
