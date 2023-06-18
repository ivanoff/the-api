const { TwitterApi } = require('twitter-api-v2');

const c = require('../controller');

const service = 'twitter';

const {
  AUTH_TWITTER_APP_KEY: appKey,
  AUTH_TWITTER_APP_SECRET: appSecret,
  AUTH_TWITTER_CALLBACK_URL: callbackURL,
} = process.env;

const oauthTokens = {};

module.exports = async (api) => api.router()
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
  .post(
    '/',
    async (ctx) => {
      const { oauth_token, oauth_verifier } = ctx.query;
      const storedAccessSecret = oauthTokens[`${oauth_token}`];
      if (!storedAccessSecret) return ctx.redirect(`/login/${service}`);

      const tempClient = new TwitterApi({
        appKey, appSecret, accessToken: oauth_token, accessSecret: storedAccessSecret,
      });

      const { accessToken, accessSecret } = await tempClient.login(oauth_verifier);

      const client = new TwitterApi({
        appKey, appSecret, accessToken, accessSecret,
      });
      const profile = await client.currentUser();
      profile.provider = service;

      const {
        id: externalId,
        name: firstName,
        screen_name: userName,
      } = profile;

      await c.externalLogin({
        ctx, service, profile, externalId, firstName, email: `${userName}@${service}`,
      });
    },
  );
