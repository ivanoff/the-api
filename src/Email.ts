import * as nodemailer from 'nodemailer';
import * as Handlebars from 'handlebars';
import { EmailParamsType } from './types';

export class Email {
  transport: any;
  message: any;

  constructor(options?) {
    const {
      EMAIL_USER: user,
      EMAIL_PASSWORD: pass,
      EMAIL_FROM: from,
      EMAIL_HOST: host,
      EMAIL_PORT: port,
      EMAIL_SECURE: isSecure,
      EMAIL_TLS_REJECTUNAUTH: rejectUnauth,
    } = process.env;
    
    const auth = { user, pass };
    const secure = isSecure && isSecure === 'true';
    const tls = rejectUnauth && { rejectUnauthorized: rejectUnauth === 'true' };
    
    const config = options || {
      auth, from, host, port, secure, tls,
    };

    this.transport = nodemailer.createTransport(config);
    this.message = {
      from: from || config.auth.user,
    };
  }

  async send({
    to, subject, text, html,
  }: EmailParamsType) {
    const message = {
      ...this.message, to, subject, text, html,
    };
    return new Promise((resolve, reject) => {
      this.transport.sendMail(message, (err, info) => (err ? reject(err) : resolve(info)));
    });
  }

  getPreparedData(template, params = {}) {
    return Handlebars.compile(template || '')(params || {});
  }
}
