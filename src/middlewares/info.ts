import { Routings } from "../Routings";

const file = Bun.file('./package.json');
const { name, version } = await file.json();

const startTime = new Date();

const info2Middleware = async (c: any, n: any) => {
  if(!c.env.totalRequests) c.env.totalRequests = 0;
  c.env.totalRequests++;

  await n();
}

const infoMiddleware = async (c: any) => {
  const { totalRequests } = c.env;

  const uptime = Math.floor((+new Date() - +startTime) / 1000);

  c.set('result', {
    startTime, uptime, totalRequests, name, version,
  });
}

const info = new Routings();
info.use('*', info2Middleware);
info.get('/info', infoMiddleware);

export { info };
