const nodemailer = require('nodemailer');

require('dotenv').config();

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

class Mail {
  constructor(options) {
    this.config = options || {
      auth, from, host, port, secure, tls,
    };
    this.transport = nodemailer.createTransport(this.config);
    this.message = {
      from: from || this.config.auth.user,
    };
    this.defaultParams = options?.defaultParams || {};
  }

  async send({
    email: to, subject, text, html,
  }) {
    const message = {
      ...this.message, to, subject, text, html,
    };
    return new Promise((resolve, reject) => {
      this.transport.sendMail(message, (err, info) => (err ? reject(err) : resolve(info)));
    });
  }

  getPreparedData(template, params = {}) {
    const result = { ...template };
    for (const key of Object.keys(result)) {
      for (const [name, replace] of Object.entries({ ...this.defaultParams, ...params })) {
        const r = new RegExp(`\\{\\{${name}\\}\\}`, 'g');
        result[`${key}`] = result[`${key}`].replace(r, replace);
      }
    }
    return result;
  }
}

module.exports = Mail;
