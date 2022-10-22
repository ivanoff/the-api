function checkToken(ctx) {
  if (!ctx?.state?.token) ctx.throw('NO_TOKEN');
}

async function tokenRequired(ctx, next) {
  checkToken(ctx);
  await next();
}

function checkOwnerToken(ctx) {
  checkToken(ctx);
  if (!ctx.params?.user_id) ctx.throw('USER_NOT_FOUND');
  if (ctx.state.token.id !== +ctx.params.user_id) ctx.throw('OWNER_REQUIRED');
}

async function ownerRequired(ctx, next) {
  checkOwnerToken(ctx);
  await next();
}

function checkRootToken(ctx) {
  const { login, statuses } = ctx.state.token || {};
  const rootMode = login === 'root' && statuses?.includes('root');
  if (!rootMode) ctx.throw('TOKEN_INVALID');
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

    if (s.length && !s.some((item) => tokenStatuses.includes(item))) ctx.throw('STATUS_INVALID');

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
  if (statusesToCheck.includes('owner') && isOwner) access = true;
  if (statusesToCheck.includes('*')) access = true;

  if (!access) ctx.throw('USER_ACCESS_DENIED');
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
