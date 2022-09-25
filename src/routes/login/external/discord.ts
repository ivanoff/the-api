import { Strategy } from 'passport-discord';
import c from '../controller';

const service = 'discord';

const {
  AUTH_DISCORD_CLIENT_ID: clientID,
  AUTH_DISCORD_CLIENT_SECRET: clientSecret,
  AUTH_DISCORD_CALLBACK_URL: callbackURL,
} = process.env;

export default async (api) => {
  api.passport.use(
    new Strategy(
      {
        clientID,
        clientSecret,
        callbackURL,
        scope: ['identify', 'email', 'guilds', 'guilds.join'],
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

      const { id: external_id, username: first_name, email } = profile;

      await c.externalLogin({
        ctx,
        service,
        profile,
        external_id,
        first_name,
        email,
      });
    });
};
