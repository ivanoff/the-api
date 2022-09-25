import { TwitterApi } from 'twitter-api-v2';
import c from '../controller';

const service = 'twitter';

const {
  AUTH_TWITTER_APP_KEY: appKey,
  AUTH_TWITTER_APP_SECRET: appSecret,
  AUTH_TWITTER_CALLBACK_URL: callbackURL,
} = process.env;

const oauthTokens = {};

export default async (api) =>
  api
    .router()
    .tag('users')
    .prefix(`/login/${service}`)
    .get('/', async (ctx) => {
      const client = new TwitterApi({ appKey, appSecret });
      const { url, oauth_token, oauth_token_secret } = await client.generateAuthLink(callbackURL);
      oauthTokens[`${oauth_token}`] = oauth_token_secret;
      setTimeout(() => delete oauthTokens[`${oauth_token}`], 1000 * 60 * 30);
      ctx.body = '';
      ctx.redirect(url);
    })
    .post('/', async (ctx) => {
      const { oauth_token, oauth_verifier } = ctx.query;
      const storedAccessSecret = oauthTokens[`${oauth_token}`];
      if (!storedAccessSecret) return ctx.redirect(`/login/${service}`);

      const tempClient = new TwitterApi({
        appKey,
        appSecret,
        accessToken: oauth_token,
        accessSecret: storedAccessSecret,
      });

      const { accessToken, accessSecret } = await tempClient.login(oauth_verifier);

      const client = new TwitterApi({
        appKey,
        appSecret,
        accessToken,
        accessSecret,
      });
      const profileRaw = await client.currentUser();
      const profile = {
        ...profileRaw,
        provider: service,
      };

      const { id: external_id, name: first_name, screen_name: userName } = profile;

      await c.externalLogin({
        ctx,
        service,
        profile,
        external_id,
        first_name,
        email: `${userName}@${service}`,
      });
    });
