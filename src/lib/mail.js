const nodemailer = require('nodemailer');

require('dotenv').config();

const {
  EMAIL_USER: user,
  EMAIL_PASSWORD: pass,
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
      auth, host, port, secure, tls,
    };
    this.transport = nodemailer.createTransport(this.config);
    this.message = {
      from: this.config.auth.user,
    };
  }

  async send({
    email: to, subject, text, html,
  }) {
    const message = {
      to, subject, text, html,
    };
    return new Promise((resolve, reject) => {
      this.transport.sendMail(message, (err, info) => (err ? reject(err) : resolve(info)));
    });
  }
}

module.exports = Mail;
