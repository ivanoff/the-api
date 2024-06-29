import { Routings } from "../../Routings";

const errorMiddleware = async (c: any, n: any) => {
  c.env.error = (err: any) => {
    const { message: m, stack } = err;
    let [ _, name, additional = '' ] = m.match(/^(\w+):?\s?(.*?)$/) || [, m];

    let errorObj = c.env.getErrorByMessage(name);
    if (!errorObj) {
      errorObj = c.env.getErrorByMessage('DEFAULT');
      name = m;
      additional = '';
    }

    c.set('result', { ...errorObj, name, additional, stack, error: true });
    c.status(errorObj.status || 500);
  }

  await n();
}

const errors = new Routings();
errors.use('*', errorMiddleware);

export { errors };
