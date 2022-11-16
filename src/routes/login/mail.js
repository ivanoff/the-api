const { Mail } = require('../../lib');

class LoginMail extends Mail {
  constructor() {
    super();
    this.templates = {
      register: {
        subject: 'Complete your registration',
        text: 'Hello, use your code {{code}} to POST /register/check',
        html: 'Hello, use your <b>code {{code}}</b> to POST <b>/register/check</b>',
      },
      recover: {
        subject: 'Recover you password',
        text: 'Hello, use your recover {{code}}</b> and new password to POST /login/restore',
        html: 'Hello, use your <b>recover {{code}}</b> and new <b>password<b> to POST <b>/register/restore</b>',
      },
    };
  }

  getPreparedData(templateName = '', params = {}) {
    const template = this.templates[`${templateName}`] || {};
    const result = { ...template };
    for (const key of Object.keys(result)) {
      for (const [name, replace] of Object.entries(params)) {
        const r = new RegExp(`\\{\\{${name}\\}\\}`, 'g');
        result[`${key}`] = result[`${key}`].replace(r, replace);
      }
    }
    return result;
  }

  async register(params) {
    const { email } = params;
    try {
      await this.send({ email, ...this.getPreparedData('register', params) });
    } catch (err) {
      console.error(err);
    }
  }

  async recover(params) {
    const { email } = params;
    try {
      await this.send({ email, ...this.getPreparedData('recover', params) });
    } catch (err) {
      console.error(err);
    }
  }
}

module.exports = LoginMail;
