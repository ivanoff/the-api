const nodemailer = require('nodemailer');
const knex = require('knex');

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
    this.connectDb();
  }

  connectDb() {
    const {
      DB_CLIENT: client,
      DB_HOST: dbHost,
      DB_PORT: dbPort,
      DB_USER: dbUser,
      DB_PASSWORD: password,
      DB_NAME: database,
      DB_SCHEMA: schema,
    } = process.env;

    const connection = {
      host: dbHost, user: dbUser, password, database, port: dbPort, ...(schema && { schema }),
    };

    this.db = knex({ client, connection });
  }

  async send({
    email, subject, text, html, checkUnsubscribe = true,
  }) {
    if (checkUnsubscribe) {
      const isUnsubscribed = await this.db('users').where({ email, isUnsubscribed: true }).first();
      if (isUnsubscribed) return;
    }
    const message = {
      ...this.message, to: email, subject, text, html,
    };
    return new Promise((resolve, reject) => {
      this.transport.sendMail(message, (err, info) => (err ? reject(err) : resolve(info)));
    });
  }

  getPreparedData(template, params = {}) {
    const result = { ...template };
    for (const key of Object.keys(result)) {
      for (const [name, replace] of Object.entries({ ...this.defaultParams, ...params })) {
        const rEnc = new RegExp(`\\{\\{\\{${name}\\}\\}\\}`, 'g');
        result[`${key}`] = result[`${key}`].replace(rEnc, encodeURIComponent(replace));
        const r = new RegExp(`\\{\\{${name}\\}\\}`, 'g');
        result[`${key}`] = result[`${key}`].replace(r, replace);
      }
    }
    return result;
  }
}

module.exports = Mail;
