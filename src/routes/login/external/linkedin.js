const { Strategy } = require('passport-linkedin-oauth2');
const c = require('../controller');

const service = 'linkedin';

const {
  AUTH_LINKEDIN_CLIENT_ID: clientID,
  AUTH_LINKEDIN_CLIENT_SECRET: clientSecret,
  AUTH_LINKEDIN_CALLBACK_URL: callbackURL,
} = process.env;

module.exports = async (api) => {
  if (!clientID || !clientSecret || !callbackURL) return;

  api.passport.use(
    new Strategy(
      {
        clientID, clientSecret, callbackURL, scope: ['r_emailaddress', 'r_liteprofile'],
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
          name: {
            givenName: firstName,
            familyName: secondName,
          },
          emails,
        } = profile;

        await c.externalLogin({
          ctx, service, profile, externalId, firstName, secondName, email: emails?.[0]?.value,
        });
      },
    );
};
