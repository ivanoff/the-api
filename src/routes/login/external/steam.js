const Strategy = require('passport-steam');
const c = require('../controller');

const service = 'steam';

const {
  AUTH_STEAM_RETURN_URL: returnURL,
  AUTH_STEAM_REALM: realm,
  AUTH_STEAM_API_KEY: apiKey,
} = process.env;

module.exports = async (api) => {
  api.passport.use(
    new Strategy(
      {
        returnURL, realm, apiKey,
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
          id: external_id,
          given_name: first_name,
          family_name: second_name,
          email,
        } = profile._json;

        await c.externalLogin(ctx, service, profile, external_id, first_name, second_name, email);
      },
    );
};
