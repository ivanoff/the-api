function checkToken(ctx) {
  if (!ctx?.state?.token) return ctx.throw('NO_TOKEN');
}

async function tokenRequired(ctx, next) {
  checkToken(ctx);
  await next();
}

function checkOwnerToken(ctx) {
  checkToken(ctx);
  if (!ctx.params?.user_id) return ctx.throw('USER_NOT_FOUND');
  if (ctx.state.token.id !== +ctx.params.user_id) return ctx.throw('OWNER_REQUIRED');
}

async function ownerRequired(ctx, next) {
  checkOwnerToken(ctx);
  await next();
}

function checkRootToken(ctx) {
  const { login, statuses } = ctx.state.token || {};
  const rootMode = login === 'root' && statuses?.includes('root');
  if (!rootMode) return ctx.throw('TOKEN_INVALID');
}

async function rootRequired(ctx, next) {
  checkRootToken(ctx);
  await next();
}

function statusRequired(statuses = [], ...restStatuses) {
  return async (ctx, next) => {
    checkToken(ctx);

    const { statuses: tokenStatuses } = ctx.state.token || {};
    const s = [].concat(statuses, restStatuses).filter(Boolean);

    if (s.length && !s.some((item) => tokenStatuses.includes(item))) return ctx.throw('STATUS_INVALID');

    await next();
  };
}

async function userAccess({
  ctx, isOwner, name, statuses,
}) {
  checkToken(ctx);

  const statusesToCheck = [].concat(statuses, ctx.state.userAccess && ctx.state.userAccess[`${name}`]).filter(Boolean);
  const { statuses: tokenStatuses } = ctx.state.token || {};

  let access = statusesToCheck.some((item) => tokenStatuses.includes(item));
  const paramsOwner = ctx.params.user_id && ctx.params.user_id === +ctx.state.token.id;
  if (statusesToCheck.includes('owner') && (isOwner || paramsOwner)) access = true;
  if (statusesToCheck.includes('*')) access = true;

  if (!access) return ctx.throw('USER_ACCESS_DENIED');
}

module.exports = {
  checkToken,
  tokenRequired,
  checkOwnerToken,
  ownerRequired,
  checkRootToken,
  rootRequired,
  statusRequired,
  userAccess,
};
