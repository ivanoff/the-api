import jwt from 'jsonwebtoken';
import { Routings } from '../Routings';

const beginMiddleware = async (c: any, next: any) => {
    const dateBegin = new Date();

    c.env.log = console.log;
    c.env.error = (err: any) => {
        const { message: m } = err;
        let [ _, name, additional = '' ] = m.match(/^(\w+):?\s?(.*?)$/) || [, m];
        
        const errObj = c.env.getErrorByMessage(name);
        c.set('result', { error: true, ...errObj, name, additional })
    }

    const token = c.req.raw.headers.get('authorization')?.replace(/^bearer\s+/i, '');
    try {
        if (token) c.set('user', jwt.verify(token, process.env.JWT_SECRET || ''));
    } catch {
        c.env.error({ message: 'NOT_FOUND' });
    }

    await next();

    if (!c.var.result) c.env.error({ message: 'NOT_FOUND' });
    const { result, relations, meta, logId } = c.var;

    const { error } = result;
    const date = new Date();
    const serverTime = date.toISOString();
    const requestTime = +date - +dateBegin;

    return c.json({ result, relations, meta, error, requestTime, serverTime, logId });
};

const beginRoute = new Routings();
beginRoute.use('*', beginMiddleware);
beginRoute.errors({
    DEFAULT: {
        code: 11,
        status: 500,
        description: 'An unexpected error occurred',
    },
    ACCESS_DENIED: {
        code: 15,
        status: 403,
        description: 'Insufficient permissions',
    },
    NOT_FOUND: {
        code: 21,
        status: 404,
        description: 'Not found',
    },
    INVALID_TOKEN: {
        code: 25,
        status: 401,
        description: 'Invalid token. Try to renew it.',
    },
    ERROR_QUERY_VALUE: {
        code: 41,
        status: 409,
        description: 'Wrong value in query',
    },
});
  
const endRoute = new Routings();
endRoute.use('*', async () => {});

export { beginRoute, endRoute };
