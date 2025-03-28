const crypto = require('crypto');
const Router = require('@koa/router');

const redis = {};
const getWithCache = (cb, timeoutOrigin = 5) => {
  const timeout = +timeoutOrigin * 1000;
  return async (ctx, next, ...other) => {
    const {
      method, url, request, state,
    } = ctx;

    const params = JSON.stringify(await ctx.params);
    const query = JSON.stringify(request.query);
    const token = state?.token?.id || '';
    const md5sum = crypto.createHash('md5').update(method + url + params + query + token);
    const key = md5sum.digest('hex');

    if (redis[`${key}`]) {
      ctx.state.log(`Get data from cache by key ${key}`);
      ctx.body = redis[`${key}`];
    } else {
      ctx.state.log(`Store data in cache for ${timeout}ms`);
      await cb(ctx, next, ...other);
      redis[`${key}`] = ctx.body;
      ((eraseKey) => setTimeout(() => delete redis[`${eraseKey}`], timeout))(key);
    }
  };
};

class RouterHandler extends Router {
  constructor(opt) {
    super(opt);
    this._prefix = opt?.prefix || '';
    this._tokenRequired = false;
    this.swagger = {};
    this.currentTag = 'default';
  }

  prefix(prefix, ...p) {
    this._prefix = `/${prefix}${this._prefix}`;
    this._prefix = this._prefix.replace(/\/+/g, '/').replace(/\/+$/, '');
    return super.prefix(prefix, ...p);
  }

  tokenRequired() {
    this._tokenRequired = true;
    return this;
  }

  tag(tagName) {
    this.currentTag = tagName;
    return this;
  }

  responseSchema(tabbleName) {
    this.currentTableName = tabbleName;
    return this;
  }

  _h(t) {
    return (path, cbOrigin, middleWare, options) => {
      const hasMiddleware = typeof middleWare === 'function';
      let o = hasMiddleware ? options : middleWare;
      const cb = (t === 'get' && o?.cache) ? getWithCache(cbOrigin, o?.cache) : cbOrigin;
      if (!o?.tag) o = { ...o, tag: this.currentTag };
      if (this.currentTableName) o = { ...o, currentTableName: this.currentTableName };
      if (this._tokenRequired) o = { ...o, tokenRequired: this._tokenRequired };
      const p = `${this._prefix}${path}`.replace(/\/+$/, '') || '/';
      const current = this.swagger[`${p}`] || {};
      this.swagger[`${p}`] = { ...current, [t]: o };
      return hasMiddleware ? super[`${t}`](path, cb, middleWare) : super[`${t}`](path, cb);
    };
  }

  get(...p) { return this._h('get')(...p); }

  post(...p) { return this._h('post')(...p); }

  put(...p) { return this._h('put')(...p); }

  patch(...p) { return this._h('patch')(...p); }

  del(...p) { return this._h('del')(...p); }

  delete(...p) { return this._h('delete')(...p); }

  all(...p) { return this._h('all')(...p); }
}

module.exports = RouterHandler;
