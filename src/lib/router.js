const Router = require('@koa/router');

class RouterHandler extends Router {
  constructor() {
    super();
    this._prefix = '';
    this.swagger = {};
  }

  prefix(prefix, ...p) {
    this._prefix += `/${prefix}`;
    this._prefix = this._prefix.replace(/\/+/g, '/');
    return super.prefix(prefix, ...p);
  }

  h(t) {
    return (path, cb, middleWare, options) => {
      const hasMiddleware = typeof middleWare === 'function';
      const o = hasMiddleware ? options : middleWare;
      this.swagger[`${this._prefix}${path}`] = { [t]: o };
      return hasMiddleware ? super[`${t}`](path, cb, middleWare) : super[`${t}`](path, cb);
    };
  }

  get(...p) { return this.h('get')(...p); }

  post(...p) { return this.h('post')(...p); }

  put(...p) { return this.h('put')(...p); }

  del(...p) { return this.h('del')(...p); }

  delete(...p) { return this.h('delete')(...p); }

  all(...p) { return this.h('all')(...p); }
}

module.exports = RouterHandler;
