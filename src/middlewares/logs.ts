import { Routings } from 'the-api-routings';

const hideObjectValues = (obj: any) => {
  if (!obj) return;

  const fieldsToHide = ['password', 'token', 'refresh', 'authorization'];
  for (const key of fieldsToHide) if (typeof obj[key] !== 'undefined') obj[key] = '<hidden>';
}

const logFn = ({ id, startTime, method, path }: any) => (...toLog: any) => {
  const date = new Date();
  const ms = +date - +startTime;
  for (const line of toLog) {
    const isPlainMessage = line instanceof Error || typeof line !== 'object';
    const logData = isPlainMessage ? line : JSON.stringify(line);
    console.log(`[${date.toISOString()}] [${id}] [${method}] [${path}] [${ms}] ${logData}`);
  }
}

const logMiddleware = async (c: any, n: any) => {
  const startTime = new Date();
  const { method, headers } = c.req.raw;
  const id = Math.random().toString(36).substring(2, 10);
  c.set('logId', id);

  const { path } = c.req;

  c.env.log = logFn({ id, startTime, method, path });

  const ip = c.env?.ip?.address;
  const query = c.req.query();
  const body = headers.get('content-type') === 'application/json' ? await c.req.json() : await c.req.text();

  hideObjectValues(query);
  hideObjectValues(body);

  c.env.log('[begin]', { headers, query, body, ip, method, path });

  await n();

  const result = c.var.result ? { ...c.var.result } : '';
  hideObjectValues(result);

  const responseSizeOnly = `${process.env.LOGS_SHOW_RESPONSE_SIZE_ONLY}` === 'true';
  const response = responseSizeOnly ? `${JSON.stringify(result).length}b` : result;

  c.env.log(response, '[end]');
}

const logs = new Routings();
logs.use('*', logMiddleware);

export { logs };
