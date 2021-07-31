const { Mail } = require('../../lib');

class LoginMail extends Mail {
  constructor() {
    super();
    this.templates = {
      check: {
        subject: 'Complete your registration',
        text: 'Hello, use your code {{code}} to POST /register/check',
        html: 'Hello, use your <b>code {{code}}</b> to POST <b>/register/check</b>',
      },
      recover: {
        subject: 'Recover you password',
        text: 'Hello, use your recover {{code}}</b> and new password to POST /login/restore',
        html: 'Hello, use your <b>recover {{code}}</b> and new <b>password<b> to POST <b>/register/check</b>',
      },
    };
  }

  getPreparedData(templateName = '', params = {}) {
    const result = this.templates[`${templateName}`] || {};
    for (const [name, replace] of Object.entries(params)) {
      for (const key of Object.keys(result)) {
        const r = new RegExp(`\\{\\{${name}\\}\\}`, 'g');
        result[`${key}`] = result[`${key}`].replace(r, replace);
      }
    }
    return result;
  }

  async check({ email, code }) {
    await this.send({ email, ...this.getPreparedData('check', { code }) });
  }

  async recover({ email, code }) {
    await this.send({ email, ...this.getPreparedData('recover', { code }) });
  }
}

module.exports = LoginMail;
