import { Strategy } from 'passport-microsoft';
import c from '../controller';

const service = 'microsoft';

const {
  AUTH_MICROSOFT_CLIENT_ID: clientID,
  AUTH_MICROSOFT_CLIENT_SECRET: clientSecret,
  AUTH_MICROSOFT_CALLBACK_URL: callbackURL,
} = process.env;

export default async (api) => {
  api.passport.use(
    new Strategy(
      {
        clientID,
        clientSecret,
        callbackURL,
        scope: ['user.read'],
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

      const { id: external_id, givenName: first_name, surname: second_name, userPrincipalName: email } = profile._json;

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
