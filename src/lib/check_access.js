async function checkToken(ctx) {
  if (!ctx.state.token) throw new Error('NO_TOKEN');
}

async function tokenRequired(ctx, next) {
  checkToken(ctx);
  await next();
}

async function ownerRequired(ctx, next) {
  if (!ctx.params?.userId || !ctx.state.token?.id) throw new Error('USER_NOT_FOUND');
  if (ctx.state.token?.id !== +ctx.params.userId) throw new Error('OWNER_REQUIRED');
  await next();
}

function checkRootToken(ctx) {
  const { login, status } = ctx.state.token || {};
  const rootMode = login === 'root' && status === 'root';
  if (!rootMode) throw new Error('TOKEN_INVALID');
}

async function rootRequired(ctx, next) {
  checkRootToken(ctx);
  await next();
}

module.exports = {
  checkToken,
  tokenRequired,
  ownerRequired,
  checkRootToken,
  rootRequired,
};
