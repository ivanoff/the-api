const { v4: uuidv4 } = require('uuid');

class Oauth2 {
  constructor(ctx) {
    this.scopes = ['identify', 'email'];

    const { db, token } = ctx.state;
    this.db = db;
    this.user = token || {};
    this.ctx = ctx;
  }

  async checkUser() {
    if (!this.user.id) return this.ctx.throw('LOGIN_REQUIRED');
    const user = await this.db('users').where({ id: this.user.id }).first();
    if (!user) return this.ctx.throw('USER_NOT_FOUND');
  }

  async addApplication() {
    await this.checkUser();

    const { name, redirectUris = [] } = this.ctx.request.body;

    const existsName = await this.db('oauth2_clients').where({ name }).first();
    if (existsName) return this.ctx.throw('OAUTH2_NAME_EXISTS', { name });

    const clientId = uuidv4();
    const secret = uuidv4();

    const [result] = await this.db('oauth2_clients').insert({
      name,
      clientId,
      secret,
      userId: this.user.id,
      redirectUris: JSON.stringify(redirectUris),
    }).returning('*');

    return result;
  }

  async updateApplication() {
    await this.checkUser();

    const { clientId } = this.ctx.params;
    const { name, redirect_uris = [] } = this.ctx.request.body;
    const userId = this.user.id;

    const client = await this.db('oauth2_clients').where({ userId, clientId }).first();
    if (!client) return this.ctx.throw('OAUTH2_APPLICATION_NOT_FOUND', { userId, clientId });

    await this.db('oauth2_clients').where({ userId, clientId }).update({
      name,
      redirect_uris: JSON.stringify(redirect_uris),
    });

    return { ok: 1 };
  }

  async removeApplication() {
    await this.checkUser();

    const { clientId } = this.ctx.params;
    const userId = this.user.id;

    const client = await this.db('oauth2_clients').where({ userId, clientId }).first();
    if (!client) return this.ctx.throw('OAUTH2_APPLICATION_NOT_FOUND', { userId, clientId });

    await this.db('oauth2_clients').where({ userId, clientId }).del();

    return { ok: 1 };
  }

  async checkClient({ client_id: clientId, redirect_uri: redirectUri, scope }) {
    if (!clientId) return this.ctx.throw('OAUTH2_INVALID_CLIENT_ID');

    const client = await this.db('oauth2_clients').where({ clientId }).first();

    if (!client) return this.ctx.throw('OAUTH2_CLIENT_NOT_FOUND');

    if (!client.redirectUris.includes(redirectUri)) return this.ctx.throw('OAUTH2_INVALID_REDIRECT_URI');

    const unknownScopes = scope.split(' ').find((s) => !this.scopes.includes(s));
    if (unknownScopes?.length) return this.ctx.throw('OAUTH2_INVALID_SCOPE', { unknownScopes });

    return { redirectUri, ...client };
  }

  async getCode() {
    const { id: oauth2ClientId } = await this.checkClient(this.ctx.request.query);

    await this.checkUser();

    const { scope: s } = this.ctx.request.query;
    const scope = JSON.stringify(s.split(' '));

    const tokenRecord = await this.db('oauth2_tokens').where({ oauth2ClientId, scope, userId: this.user.id }).first();
    let { code } = tokenRecord || {};

    if (!code) {
      code = uuidv4();
      await this.db('oauth2_tokens').insert({
        oauth2ClientId, scope, code, userId: this.user.id,
      });
    }

    return { code };
  }

  async getCodeAndInfo() {
    const { name, redirectUri } = await this.checkClient(this.ctx.request.query);
    const { code } = await this.getCode();
    return { name, redirectUri, code };
  }

  async getCodeAndRedirect() {
    const { code } = await this.getCode();
    if (code) this.ctx.redirect(`${this.ctx.request.query.redirect_uri}?code=${code}`);
  }

  async getToken() {
    const { code, client_id: clientId, client_secret: clientSecret } = this.ctx.request.body;

    if (!code) return this.ctx.throw('OAUTH2_CODE_REQUIRED');

    const [clientOk, tokensOk] = await Promise.all([
      this.db('oauth2_clients').where({ clientId, secret: clientSecret }).first(),
      this.db('oauth2_tokens').where({ code }).first(),
    ]);

    if (!clientOk || !tokensOk) return this.ctx.throw('OAUTH2_GET_TOKEN_ERROR');

    const accessToken = uuidv4();
    const refreshToken = uuidv4();

    await this.db('oauth2_tokens').update({ accessToken, refreshToken, code: null }).where({ code });

    return { access_token: accessToken, refresh_token: refreshToken };
  }

  async getUserInfo() {
    const { authorization } = this.ctx.headers;
    const accessToken = authorization.replace(/^Bearer /, '');
    const { userId: id, scope } = (await this.db('oauth2_tokens').where({ accessToken }).first()) || {};

    if (!id) return this.ctx.throw('OAUTH2_INVALID_TOKEN');

    const {
      login, firstName, secondName, email,
    } = (await this.db('users').where({ id }).first()) || {};

    return {
      id,
      ...(scope.includes('identify') && { login, firstName, secondName }),
      ...(scope.includes('email') && { email }),
    };
  }
}

module.exports = Oauth2;
