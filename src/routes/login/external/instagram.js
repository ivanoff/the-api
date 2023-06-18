const Strategy = require('passport-instagram');
const c = require('../controller');

const service = 'instagram';

const {
  AUTH_INSTAGRAM_CLIENT_ID: clientID,
  AUTH_INSTAGRAM_CLIENT_SECRET: clientSecret,
  AUTH_INSTAGRAM_CALLBACK_URL: callbackURL,
} = process.env;

module.exports = async (api) => {
  if (!clientID || !clientSecret || !callbackURL) return;

  api.passport.use(
    new Strategy(
      {
        clientID, clientSecret, callbackURL,
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
          given_name: firstName,
          family_name: secondName,
          email,
        } = profile._json;

        await c.externalLogin({
          ctx, service, profile, externalId, firstName, secondName, email,
        });
      },
    );
};
