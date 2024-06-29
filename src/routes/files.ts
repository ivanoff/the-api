import { Routings } from '../Routings';

const fileErrors = {
    DEFAULT: {
        code: 11,
        status: 500,
        description: 'An unexpected error occurred',
    },
    NOT_FOUND: {
        code: 21,
        status: 404,
        description: 'Not found',
    },
};

const filesMiddleware = async (c: any, next: any) => {
    const dateBegin = new Date();

    c.env.log = console.log;
    c.env.error = (...err: any) => {
        c.set('result', { error: true })
        console.error(...err);
    }

    await next();

    if (!c.var.result) c.env.error({ message: 'NOT_FOUND' });
    const { result, meta, logId } = c.var;

    const { error } = result;
    const date = new Date();
    const serverTime = date.toISOString();
    const requestTime = +date - +dateBegin;

    return c.json({ result, meta, error, requestTime, serverTime, logId });
};

const filesRoute = new Routings();
filesRoute.use('*', filesMiddleware);
filesRoute.errors(fileErrors);

export { filesRoute };
