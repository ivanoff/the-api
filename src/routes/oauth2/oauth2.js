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
    if (!client_id) return this.ctx.throw('OAUTH2_INVALID_CLIENT_ID');

    const client = await this.db('oauth2_clients').where({ client_id }).first();

    if (!client) return this.ctx.throw('OAUTH2_CLIENT_NOT_FOUND');

    if (!client.redirect_uris.includes(redirect_uri)) return this.ctx.throw('OAUTH2_INVALID_REDIRECT_URI');

    const unknownScopes = scope.split(' ').find((s) => !this.scopes.includes(s));
    if (unknownScopes?.length) return this.ctx.throw('OAUTH2_INVALID_SCOPE', { unknownScopes });

    return { redirect_uri, ...client };
  }

  async getCode() {
    const { id: oauth2_client_id } = await this.checkClient(this.ctx.request.query);

    if (!this.user.id) return this.ctx.throw('LOGIN_REQUIRED');
    const user = await this.db('users').where({ id: this.user.id }).first();
    if (!user) return this.ctx.throw('USER_NOT_FOUND');

    const { scope: s } = this.ctx.request.query;
    const scope = JSON.stringify(s.split(' '));

    const tokenRecord = await this.db('oauth2_tokens').where({ oauth2_client_id, scope, user_id: this.user.id }).first();
    let { code } = tokenRecord || {};

    if (!code) {
      code = uuidv4();
      await this.db('oauth2_tokens').insert({
        oauth2_client_id, scope, code, user_id: this.user.id,
      });
    }

    return { code };
  }

  async getCodeAndInfo() {
    const { name, redirect_uri } = await this.checkClient(this.ctx.request.query);
    const { code } = await this.getCode();
    return { name, redirect_uri, code };
  }

  async getCodeAndRedirect() {
    const { code } = await this.getCode();
    if (code) this.ctx.redirect(`${this.ctx.request.query.redirect_uri}?code=${code}`);
  }

  async getToken() {
    const { code, client_id, client_secret } = this.ctx.request.body;

    if (!code) return this.ctx.throw('OAUTH2_CODE_REQUIRED');

    const [clientOk, tokensOk] = await Promise.all([
      this.db('oauth2_clients').where({ client_id, secret: client_secret }).first(),
      this.db('oauth2_tokens').where({ code }).first(),
    ]);

    if (!clientOk || !tokensOk) return this.ctx.throw('OAUTH2_GET_TOKEN_ERROR');

    const access_token = uuidv4();
    const refresh_token = uuidv4();

    await this.db('oauth2_tokens').update({ access_token, refresh_token, code: null }).where({ code });

    return { access_token, refresh_token };
  }

  async getUserInfo() {
    const { authorization } = this.ctx.headers;
    const access_token = authorization.replace(/^Bearer /, '');
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
