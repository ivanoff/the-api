const nodemailer = require('nodemailer');
const { email: auth } = require('../config');

const transport = nodemailer.createTransport({
  auth,
  host: 'load43.com',
  port: 587,
  secure: false,
  tls: {
    rejectUnauthorized: false,
  },
});

const send = ({ to, code, recover }) => {
  const html = code ? `Hello, use your Load43 code <b>${code}</b> or <a href="https://load43.com/register/check_email/?code=${recover}">direct link</a>`
    : `Hello, set your Load43 password here: <a href="https://load43.com/login/new_password?code=${recover}">direct link</a>`;
  const message = {
    to,
    from: auth.user,
    subject: 'Load43 complete registration code',
    text: `Hello, use your Load43 code ${code} or direct link https://load43.com/register/check_email/?code=${recover}`,
    html,
  };
  transport.sendMail(message, (err, info) => {
    console.log({ err, info });
  });
};

module.exports = { send };
