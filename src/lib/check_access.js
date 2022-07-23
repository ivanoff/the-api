async function tokenRequired(ctx, next) {
  if (!ctx.state.token) throw new Error('NO_TOKEN');
  await next();
}

async function ownerRequired(ctx, next) {
  if (!ctx.params?.userId || !ctx.state.token?.id) throw new Error('USER_NOT_FOUND');
  if (ctx.state.token?.id !== +ctx.params.userId) throw new Error('OWNER_REQUIRED');
  await next();
}

async function rootRequired(ctx, next) {
  const { login, status } = ctx.state.token || {};
  const rootMode = login === 'root' && status === 'root';
  if (!rootMode) throw new Error('TOKEN_INVALID');
  await next();
}

module.exports = {
  tokenRequired,
  ownerRequired,
  rootRequired,
};
