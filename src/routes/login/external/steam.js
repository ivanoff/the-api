const { Strategy } = require('passport-steam');
const c = require('../controller');

const service = 'steam';

const {
  AUTH_STEAM_KEY: apiKey,
  AUTH_STEAM_RETURN_URL: returnURL,
  AUTH_STEAM_REALM: realm,
} = process.env;

module.exports = async (api) => {
  if (!apiKey || !returnURL || !realm) return;

  api.passport.use(
    new Strategy(
      {
        apiKey, returnURL, realm,
      },
      (identifier, profile, done) => done(null, { identifier, profile }),
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
          displayName: firstName,
        } = profile;

        await c.externalLogin({
          ctx, service, profile, externalId, firstName,
        });
      },
    );
};
