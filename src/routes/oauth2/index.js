const Oauth2 = require('./oauth2');

module.exports = async (api) => api.router()
  .get('/oauth2/code', async (ctx) => {
    const oauth2 = new Oauth2(ctx);
    ctx.body = await oauth2.getCodeAndInfo();
  })
  .get('/oauth2/authorize', async (ctx) => {
    const oauth2 = new Oauth2(ctx);
    await oauth2.getCodeAndRedirect();
  })
  .post('/oauth2/token', async (ctx) => {
    const oauth2 = new Oauth2(ctx);
    ctx.body = await oauth2.getToken();
  })
  .get('/oauth2/me', async (ctx) => {
    const oauth2 = new Oauth2(ctx);
    ctx.body = await oauth2.getUserInfo();
  });
