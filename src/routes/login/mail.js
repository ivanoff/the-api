const { Mail } = require('../../lib');

class LoginMail extends Mail {
  async check({ email, code }) {
    const subject = 'Complete your registration';
    const text = `Hello, use your code ${code} to POST /register/check`;
    const html = `Hello, use your <b>code ${code}</b> to POST <b>/register/check</b>`;
    await this.send({
      email, subject, text, html,
    });
  }

  async recover({ email, recover }) {
    const subject = 'Recover you password';
    const text = `Hello, use your recover ${recover}</b> and new password to POST /login/restore`;
    const html = `Hello, use your <b>recover ${recover}</b> and new <b>password<b> to POST <b>/register/check</b>`;
    await this.send({
      email, subject, text, html,
    });
  }
}

module.exports = LoginMail;
