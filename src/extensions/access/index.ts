export default async (ctx, next) => {
  if (!ctx.state.token) throw new Error('NO_TOKEN');
  await next();
};
