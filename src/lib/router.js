const Router = require('@koa/router');

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

  responseSchema(schemaName) {
    this.currentSchema = schemaName;
    return this;
  }

  _h(t) {
    return (path, cb, middleWare, options) => {
      const hasMiddleware = typeof middleWare === 'function';
      let o = hasMiddleware ? options : middleWare;
      if (!o?.tag) o = { ...o, tag: this.currentTag };
      if (this.currentSchema) o = { ...o, currentSchema: this.currentSchema };
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
