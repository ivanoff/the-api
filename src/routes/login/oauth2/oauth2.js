const { v4: uuidv4 } = require('uuid');

class Oauth2 {
  constructor(ctx) {
    this.scopes = ['identify', 'email'];

    const { db, token } = ctx.state;
    this.db = db;
    this.user = token || {};
    this.ctx = ctx;
  }

  async checkClient({ client_id, redirect_uri, scope }) {
    const client = await this.db('oauth2_clients').where({ client_id }).first();

    if (!client) return this.ctx.throw('OAUTH2_CLIENT_NOT_FOUND');

    if (!client.redirect_uris.includes(redirect_uri)) return this.ctx.throw('OAUTH2_INVALID_REDIRECT_URI');

    const unknownScopes = scope.split(' ').find((s) => !this.scopes.includes(s));
    if (unknownScopes?.length) return this.ctx.throw('OAUTH2_INVALID_SCOPE', { unknownScopes });

    return client;
  }

  async getClientInfo() {
    const { name } = await this.checkClient(this.ctx.request.query);
    return { name };
  }

  async getCode() {
    await this.checkClient(this.ctx.request.query);

    if (!this.user.id) return this.ctx.throw('LOGIN_REQUIRED');
    const user = await this.db('users').where({ id: this.user.id }).first();
    if (!user) return this.ctx.throw('USER_NOT_FOUND');

    const code = uuidv4();
    const { client_id, scope } = this.ctx.request.query;
    this.db('oauth2_tokens').insert({ client_id, scope, code });

    return { code };
  }

  async getCodeAndRedirect() {
    const { code } = this.getCode();
    if (code) this.ctx.redirect(`${this.ctx.request.query.redirect_uri}?code=${code}`);
  }

  async getToken() {
    const { code, client_id, secret } = this.ctx.request.query;

    if (!code) return this.ctx.throw('OAUTH2_CODE_REQUIRED');

    const [clientOk, secretOk, tokensOk] = await Promise.all([
      this.checkClient(client_id),
      this.db('oauth2_clients').where({ client_id, secret }).first(),
      this.db('oauth2_tokens').where({ code }).first(),
    ]);

    if (!clientOk || !secretOk || !tokensOk) return this.ctx.throw('OAUTH2_GET_TOKEN_ERROR');

    const access_token = uuidv4();
    const refresh_token = uuidv4();

    this.db('oauth2_tokens').update({ access_token, refresh_token, code: null }).where({ code });

    return { access_token, refresh_token };
  }

  async getUserInfo() {
    const { authorization: access_token } = this.ctx.headers;
    const { user_id: id, scope } = (await this.db('oauth2_tokens').where({ access_token }).first()) || {};

    if (!id) return this.ctx.throw('OAUTH2_INVALID_TOKEN');

    const {
      login, first_name, second_name, email,
    } = (await this.db('users').where({ id }).first()) || {};

    return {
      id,
      ...(scope.includes('identify') && { login, first_name, second_name }),
      ...(scope.includes('email') && { email }),
    };
  }
}

module.exports = Oauth2;
