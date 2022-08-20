async function checkToken(ctx) {
  if (!ctx.state.token) ctx.throw('NO_TOKEN');
}

async function tokenRequired(ctx, next) {
  checkToken(ctx);
  await next();
}

async function checkOwnerToken(ctx) {
  checkToken(ctx);
  if (!ctx.params?.user_id) ctx.throw('USER_NOT_FOUND');
  if (ctx.state.token.id !== +ctx.params.user_id) ctx.throw('OWNER_REQUIRED');
}

async function ownerRequired(ctx, next) {
  checkOwnerToken(ctx);
  await next();
}

function checkRootToken(ctx) {
  const { login, status } = ctx.state.token || {};
  const rootMode = login === 'root' && status === 'root';
  if (!rootMode) ctx.throw('TOKEN_INVALID');
}

async function rootRequired(ctx, next) {
  checkRootToken(ctx);
  await next();
}

module.exports = {
  checkToken,
  tokenRequired,
  checkOwnerToken,
  ownerRequired,
  checkRootToken,
  rootRequired,
};
