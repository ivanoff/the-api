import Strategy from 'passport-google-oauth20';
import c from '../controller';

const service = 'google';

const {
  AUTH_GOOGLE_CLIENT_ID: clientID,
  AUTH_GOOGLE_CLIENT_SECRET: clientSecret,
  AUTH_GOOGLE_CALLBACK_URL: callbackURL,
} = process.env;

export default async (api) => {
  api.passport.use(
    new Strategy(
      {
        clientID,
        clientSecret,
        callbackURL,
        scope: ['profile', 'email'],
      },
      (token, refresh, profile, done) => done(null, { token, refresh, profile }),
    ),
  );

  return api
    .router()
    .tag('users')
    .get(`/login/${service}`, api.passport.authenticate(service))
    .post(`/login/${service}`, async (ctx) => {
      const { profile }: { profile: any } = await new Promise((resolve, reject) => {
        api.passport.authenticate(service, (err, res) => (err ? reject(err) : resolve(res)))(ctx);
      });

      const { sub: external_id, given_name: first_name, family_name: second_name, email } = profile._json;

      await c.externalLogin({
        ctx,
        service,
        profile,
        external_id,
        first_name,
        second_name,
        email,
      });
    });
};
