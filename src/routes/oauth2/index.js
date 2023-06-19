const Oauth2 = require('./oauth2');

module.exports = async (api) => api.router()
  .post('/oauth2/applications', async (ctx) => {
    const oauth2 = new Oauth2(ctx);
    ctx.body = await oauth2.addApplication();
  })
  .patch('/oauth2/applications/:clientId', async (ctx) => {
    const oauth2 = new Oauth2(ctx);
    ctx.body = await oauth2.updateApplication();
  })
  .delete('/oauth2/applications/:clientId', async (ctx) => {
    const oauth2 = new Oauth2(ctx);
    ctx.body = await oauth2.removeApplication();
  })
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
