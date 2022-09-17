const flattening = require('flattening');
const { checkToken, checkOwnerToken, checkRootToken } = require('./check_access');

class KoaKnexHelper {
  constructor({
    ctx,
    table,
    join,
    hiddenFieldsByStatus,
    forbiddenFieldsToAdd,
    required,
    defaultWhere,
    tokenRequired,
    ownerRequired,
    rootRequired,
    tableInfo,
  } = {}) {
    this.ctx = ctx;
    this.table = table;
    this.join = join || [];
    this.hiddenFieldsByStatus = hiddenFieldsByStatus || {};
    this.forbiddenFieldsToAdd = forbiddenFieldsToAdd || ['id', 'created_at', 'updated_at', 'deleted_at', 'deleted'];
    this.required = required || {};
    this.defaultWhere = defaultWhere || {};
    this.tokenRequired = tokenRequired?.reduce((acc, cur) => ({ ...acc, [cur]: true }), {}) || {};
    this.ownerRequired = ownerRequired?.reduce((acc, cur) => ({ ...acc, [cur]: true }), {}) || {};
    this.rootRequired = rootRequired?.reduce((acc, cur) => ({ ...acc, [cur]: true }), {}) || {};
    this.hiddenColumns = [];
    this.tableInfo = tableInfo || {};
    this.updateHiddenColumns();
    this.hiddenColumns.map((item) => delete this.tableInfo[`${item}`]);
    this.coaliseWhere = {};
  }

  sort(_sort, db) {
    if (!_sort) return;

    _sort.split(',').forEach((item) => {
      if (item.match(/^random\(\)$/i)) return this.res.orderBy(db.raw('RANDOM()'));

      const match = item.match(/^(-)?(.*)$/);
      this.res.orderBy(match[2], match[1] && 'desc');
    });
  }

  pagination({ _page, _skip = 0, _limit }) {
    if (!_limit) return;

    this.res.limit(_limit);
    const offset = _page ? (_page - 1) * _limit : 0;
    console.log({ offset, _skip });
    this.res.offset(offset + (+_skip));
  }

  where(whereObj) {
    if (!whereObj) return;

    for (const [key, value] of Object.entries(whereObj)) {
      if (key.match(/~$/)) {
        // iLike
        this.res.where(key.replace(/~$/, ''), 'ilike', value);
      } else if (key.match(/_(from|to)_/)) {
        if (value !== '') {
          const m = key.match(/_(from|to)_(.+)$/);
          const sign = m[1] === 'from' ? '>=' : '<=';

          const coaliseWhere = this.coaliseWhere[`${m[2]}`];
          if (coaliseWhere) {
            this.res.whereRaw(`${coaliseWhere} ${sign} ?`, [value]);
          } else {
            this.res.where(`${m[2]}`, sign, value);
          }
        }
      } else if (Array.isArray(value)) {
        this.res.whereIn(key, value);
      } else if (value === null) {
        this.res.whereNull(key);
      } else if (this.coaliseWhere[`${key}`]) {
        const coaliseWhere = this.coaliseWhere[`${key}`];
        this.res.whereRaw(`${coaliseWhere} = ?`, [value]);
      } else {
        this.res.where(key, value);
      }
    }
  }

  updateHiddenColumns() {
    const hideByStatus = Array.isArray(this.token?.statuses)
      && [].concat(this.token.statuses.map((status) => this.hiddenFieldsByStatus[`${status}`]));
    const hideForOwner = this.isOwner && this.hiddenFieldsByStatus.owner;
    this.hiddenColumns = hideForOwner || hideByStatus || this.hiddenFieldsByStatus.default || [];
  }

  fields(_fields, db) {
    this.updateHiddenColumns();

    const f = _fields && _fields.split(',');
    const joinCoaleise = (f || Object.keys(this.rows)).filter((name) => !this.hiddenColumns.includes(name)).map((l) => `${this.table}.${l}`);

    const join = f ? this.join.filter(({ table }) => f.includes(table)) : this.join;
    for (const {
      table, as, where, whereBindings, alias, fields, field, limit, orderBy,
    } of join) {
      const orderByStr = orderBy ? `ORDER BY ${orderBy}` : '';
      const limitStr = limit ? `LIMIT ${limit}` : '';
      const lang = table === 'lang' && this.lang && this.lang.match(/^\w{2}$/) ? `AND lang='${this.lang}'` : '';
      const ff = fields?.map((item) => (typeof item === 'string'
        ? `'${item}', "${as || table}".${item}`
        : `'${Object.keys(item)[0]}', ${Object.values(item)[0]}`));
      const f2 = ff ? `json_build_object(${ff.join(', ')})` : `"${as || table}".*`;
      const f3 = field || `jsonb_agg(${f2})`;
      const wb = {};
      if (whereBindings) {
        if (!this.ctx) continue;
        const { params, query, state } = this.ctx;
        const dd = flattening({ params, query, token: state.token });
        if (Object.values(whereBindings).filter((item) => !dd[`${item}`]).length) continue;
        for (const [k, v] of Object.entries(whereBindings)) wb[`${k}`] = dd[`${v}`];
      }

      const coaliseWhere = `COALESCE( ( SELECT ${f3} FROM (
        SELECT * FROM "${table}" AS "${as || table}"
        WHERE ${where} ${lang}
        ${orderByStr}
        ${limitStr}
      ) ${as || table}), NULL)`;

      this.coaliseWhere = { ...this.coaliseWhere, [`${alias || table}`]: coaliseWhere };

      joinCoaleise.push(db.raw(`${coaliseWhere} AS "${alias || table}"`, wb));
    }

    this.res.column(joinCoaleise);
  }

  checkDeleted() {
    if (this.rows.deleted) this.res.where({ [`${this.table}.deleted`]: false });
  }

  /** return data from table. Use '_fields', '_sort', '_start', '_limit' options
 * examples:
 * - second page, 1 record per page, sort by title desc, only id and title fields:
 *   /ships?_fields=id,title&_sort=-title&_page=2&_limit=1
 * - skip 100 records, get next 10 records: /ships?_skip=100&_limit=10
 * - search by id and title: /ships?_fields=title&id=2&title=second data
 * - search by multiply ids: /ships?_fields=id&id=1&id=3
 * - search by 'like' mask: /ships?_fields=title&title~=_e%25 d_ta
 * - search from-to: /ships?_from_year=2010&_to_year=2020
 */

  optionsGet() {
    const fields = {};
    const fieldsSearchLike = {};
    const fieldsFromTo = {};
    for (const [key, data] of Object.entries(this.tableInfo || {})) {
      fields[`${key}`] = data.data_type;
      if (data.data_type === 'string') fieldsSearchLike[`${key}~`] = data.data_type;
      if (data.data_type !== 'boolean' && data.data_type !== 'file') {
        fieldsFromTo[`_from_${key}`] = data.data_type;
        fieldsFromTo[`_to_${key}`] = data.data_type;
      }
    }

    const queryParameters = {
      ...fields,
      ...fieldsSearchLike,
      ...fieldsFromTo,
      _fields: {
        type: 'string',
        example: 'id,name',
      },
      _sort: {
        type: 'string',
        example: '-created_at,name,random()',
      },
      _limit: 'integer',
      _page: 'integer',
      _skip: 'integer',
    };
    return {
      tokenRequired: this.tokenRequired.get,
      ownerRequired: this.ownerRequired.get,
      rootRequired: this.rootRequired.get,
      queryParameters,
    };
  }

  async get({ ctx }) {
    if (this.tokenRequired.get) await checkToken(ctx);
    if (this.ownerRequired.get) await checkOwnerToken(ctx);
    if (this.rootRequired.get) await checkRootToken(ctx);

    const {
      db, tablesInfo, token,
    } = ctx.state;
    this.token = token;

    const {
      _fields, _sort, _page, _skip, _limit, _lang, _isNull, _or, ...where
    } = ctx.request.query;

    this.lang = _lang;
    this.rows = tablesInfo[this.table] || {};
    this.res = db(this.table);

    const { user_id } = await this.res.clone().first() || {};
    this.isOwner = token?.id && token.id === user_id;

    if (_or) this.res.where(function () { [].concat(_or).map((key) => this.orWhere(key)); });
    if (_isNull) [].concat(_isNull).map((key) => this.res.andWhereNull(key));

    this.fields(_fields, db);

    this.where(Object.entries({ ...this.defaultWhere, ...where }).reduce((acc, [cur, val]) => ({ ...acc, [`${cur}`]: val }), {}));
    this.checkDeleted();

    const total = +(await db.from({ w: this.res }).count('*'))[0].count;

    this.sort(_sort, db);
    this.pagination({ _page, _skip, _limit });
    // if (_or) console.log(this.res.toSQL())
    return { total, data: await this.res };
  }

  optionsGetById() {
    return {
      tokenRequired: this.tokenRequired.get,
      ownerRequired: this.ownerRequired.get,
      rootRequired: this.rootRequired.get,
    };
  }

  async getById({ ctx }) {
    if (this.tokenRequired.get) await checkToken(ctx);
    if (this.ownerRequired.get) await checkOwnerToken(ctx);
    if (this.rootRequired.get) await checkRootToken(ctx);

    const { db, tablesInfo, token } = ctx.state;
    const { id } = ctx.params;
    const {
      _fields, _lang, _or, ...where
    } = ctx.request.query;
    this.token = token;
    this.lang = _lang;

    this.rows = tablesInfo[this.table] || {};
    this.res = db(this.table);

    if (_or) this.res.where(function () { [].concat(_or).map((key) => this.orWhere(key)); });
    this.where({ ...where, [`${this.table}.id`]: id });

    this.checkDeleted();

    const { id: tokenId } = token || {};
    const { user_id } = await this.res.clone().first() || {};
    this.isOwner = tokenId && tokenId === user_id;

    this.fields(_fields, db);
    return this.res.first();
  }

  updateIncomingData(ctx, data) {
    const { tablesInfo, token } = ctx.state;
    let result = { ...data };
    const rows = tablesInfo[this.table] || {};

    for (const [key, error_code] of Object.entries(this.required)) {
      if (!result[`${key}`]) throw new Error(error_code);
    }

    for (const key of this.forbiddenFieldsToAdd) {
      delete result[`${key}`];
    }

    result = { ...ctx.params, ...result };

    for (const r of Object.keys(result)) {
      if (rows[`${r}`] && result[`${r}`]) continue;
      delete result[`${r}`];
    }

    if (rows.user_id && token) result.user_id = token.id;

    return result;
  }

  optionsAdd() {
    const schema = Object.entries(this.tableInfo || {}).reduce((acc, [key, data]) => {
      const keyForbiddeen = this.forbiddenFieldsToAdd.includes(key);
      return keyForbiddeen ? acc : { ...acc, [key]: data };
    }, {});

    return {
      tokenRequired: this.tokenRequired.add,
      ownerRequired: this.ownerRequired.add,
      rootRequired: this.rootRequired.add,
      schema,
    };
  }

  async add({ ctx }) {
    if (this.tokenRequired.add) await checkToken(ctx);
    if (this.ownerRequired.add) await checkOwnerToken(ctx);
    if (this.rootRequired.add) await checkRootToken(ctx);

    const { db } = ctx.state;

    const looksLikeArray = Object.keys(ctx.request.body).every((j, i) => i === +j);
    const body = looksLikeArray ? Object.values(ctx.request.body) : ctx.request.body;

    const data = this.updateIncomingData(ctx, body);

    Object.keys(data).map((key) => (data[`${key}`] = data[`${key}`] ?? null));

    let result = await db(this.table).insert(data).returning('*');

    // SQLite fix
    if (Number.isInteger(result[0])) result = db(this.table).where({ id: result[0] });

    return result[0];
  }

  optionsUpdate() {
    const schema = Object.entries(this.tableInfo || {}).reduce((acc, [key, data]) => {
      const keyForbiddeen = this.forbiddenFieldsToAdd.includes(key);
      return keyForbiddeen ? acc : { ...acc, [key]: data };
    }, {});

    return {
      tokenRequired: this.tokenRequired.update,
      ownerRequired: this.ownerRequired.update,
      rootRequired: this.rootRequired.update,
      schema,
    };
  }

  async update({ ctx }) {
    if (this.tokenRequired.update) await checkToken(ctx);
    if (this.ownerRequired.update) await checkOwnerToken(ctx);
    if (this.rootRequired.update) await checkRootToken(ctx);

    const { db, tablesInfo, token } = ctx.state;
    const rows = tablesInfo[this.table] || {};

    const where = { ...ctx.params };
    if (rows.deleted) where.deleted = false;
    if (rows.user_id && token && token.id !== -1) where.user_id = token.id;

    const data = { ...ctx.request.body };

    for (const key of this.forbiddenFieldsToAdd) {
      delete data[`${key}`];
    }

    if (rows.time_updated) data.time_updated = db.fn.now();

    await db(this.table).update(data).where(where);
    return this.getById({ ctx });
  }

  optionsDelete() {
    return {
      tokenRequired: this.tokenRequired.delete,
      ownerRequired: this.ownerRequired.delete,
      rootRequired: this.rootRequired.delete,
    };
  }

  async delete({ ctx }) {
    if (this.tokenRequired.delete) await checkToken(ctx);
    if (this.ownerRequired.delete) await checkOwnerToken(ctx);
    if (this.rootRequired.delete) await checkRootToken(ctx);

    const { db, tablesInfo, token } = ctx.state;
    const rows = tablesInfo[this.table] || {};

    const where = { ...ctx.params };
    if (rows.deleted) where.deleted = false;
    if (token.id !== -1) where.user_id = token.id;

    const t = db(this.table).where(where);
    return rows.deleted ? t.update({ deleted: true }) : t.delete();
  }
}

module.exports = KoaKnexHelper;
