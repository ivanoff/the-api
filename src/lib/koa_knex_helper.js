const flattening = require('flattening');
const {
  checkToken, checkOwnerToken, checkRootToken, userAccess,
} = require('./check_access');

class KoaKnexHelper {
  constructor({
    ctx,
    table,
    schema,
    aliases,
    join,
    leftJoin,
    lang,
    translate,
    hiddenFieldsByStatus,
    forbiddenFieldsToAdd,
    searchFields,
    required,
    defaultWhere,
    defaultSort,
    tokenRequired,
    ownerRequired,
    rootRequired,
    access,
    accessByStatuses,
    tableInfo,
    deletedReplacements,
    includeDeleted,
    cache,
  } = {}) {
    this.ctx = ctx;
    this.table = table;
    this.schema = schema || 'public';
    this.aliases = aliases || {};
    this.join = join || [];
    this.leftJoin = leftJoin || [];
    this.lang = lang || 'en';
    this.translate = translate || [];
    this.hiddenFieldsByStatus = hiddenFieldsByStatus || {};
    this.forbiddenFieldsToAdd = forbiddenFieldsToAdd || ['id', 'created_at', 'updated_at', 'deleted_at', 'deleted'];
    this.required = required || {};
    this.defaultWhere = defaultWhere || {};
    this.defaultSort = defaultSort;
    this.tokenRequired = tokenRequired?.reduce((acc, cur) => ({ ...acc, [cur]: true }), {}) || {};
    this.ownerRequired = ownerRequired?.reduce((acc, cur) => ({ ...acc, [cur]: true }), {}) || {};
    this.rootRequired = rootRequired?.reduce((acc, cur) => ({ ...acc, [cur]: true }), {}) || {};
    this.access = access || {};
    this.accessByStatuses = accessByStatuses || {};
    this.hiddenColumns = [];
    this.searchFields = searchFields || [];
    this.tableInfo = tableInfo || {};
    this.deletedReplacements = deletedReplacements;
    this.includeDeleted = typeof includeDeleted === 'boolean' ? includeDeleted : !!this.deletedReplacements;
    this.updateHiddenColumns();
    this.hiddenColumns.map((item) => delete this.tableInfo[`${item}`]);
    this.coaliseWhere = {};
    this.coaliseWhereReplacements = {};
    this.cache = cache;
  }

  getDbWithSchema(ctx) {
    const result = ctx.state.db(this.table);
    if (this.schema) result.withSchema(this.schema);
    return result;
  }

  getTableRows(ctx) {
    const { tablesInfo } = ctx.state;
    return tablesInfo[`${this.schema}.${this.table}`] || {};
  }

  sort(sort, db) {
    const _sort = sort || this.defaultSort;
    if (!_sort) return;

    _sort.split(',').forEach((item) => {
      if (item.match(/^random\(\)$/i)) return this.res.orderBy(db.raw('RANDOM()'));

      const match = item.match(/^(-)?(.*)$/);
      this.res.orderBy(match[2], match[1] && 'desc');
    });
  }

  pagination({
    _page, _skip = 0, _limit, _unlimited,
  }) {
    const isUnlimited = _unlimited === 'true' || _unlimited === true;
    if (!_limit || isUnlimited) return;

    this.res.limit(_limit);
    const offset = _page ? (_page - 1) * _limit : 0;
    this.res.offset(offset + (+_skip));
  }

  where(whereObj) {
    if (!whereObj) return;

    for (const [key, value] of Object.entries(whereObj)) {
      if (key.match(/~$/)) {
        // iLike
        this.res.where(key.replace(/~$/, ''), 'ilike', value);
      } else if (key.match(/!$/)) {
        this.res.whereNot(key.replace(/!$/, ''), value);
      } else if (key.match(/^_null_/)) {
        const m = key.match(/^_null_(.+)$/);
        this.res.whereNull(m[1]);
      } else if (key.match(/^_not_null_/)) {
        const m = key.match(/^_not_null_(.+)$/);
        this.res.whereNotNull(m[1]);
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
        this.res.whereRaw(`${coaliseWhere} = :_value`, { ...this.coaliseWhereReplacements, _value: value });
      } else if (this.leftJoin && !key.includes('.')) {
        this.res.where({ [`${this.table}.${key}`]: value });
      } else {
        this.res.where(key, value);
      }
    }
  }

  updateHiddenColumns() {
    const defaultStatus = 'default';
    let statusesInHidden;
    const { statuses } = this.token || {};
    if (Array.isArray(statuses)) {
      statusesInHidden = statuses.filter((s) => this.hiddenFieldsByStatus[`${s}`]);
      if (!statusesInHidden.length && this.hiddenFieldsByStatus[`${defaultStatus}`]) statusesInHidden = [defaultStatus];
    }
    const hideByStatus = statusesInHidden && statusesInHidden.reduce((acc, status) => [...acc, ...this.hiddenFieldsByStatus[`${status}`]], []);
    const hideForOwner = this.isOwner && this.hiddenFieldsByStatus.owner;

    this.hiddenColumns = hideForOwner || hideByStatus || this.hiddenFieldsByStatus[`${defaultStatus}`] || [];
    this.hiddenColumns = this.hiddenColumns.concat(this.hiddenColumns.map((item) => `${this.table}.${item}`));
  }

  fields({ ctx, _fields, db }) {
    this.updateHiddenColumns();

    if (this.leftJoin.length) {
      this.leftJoin.map((item) => this.res.leftJoin(...item));
    }

    const f = _fields && _fields.split(',');
    let joinCoaleise = (f || Object.keys(this.rows)).filter((name) => !this.hiddenColumns.includes(name)).map((l) => `${this.table}.${l}`);

    if (this.includeDeleted && this.deletedReplacements) {
      joinCoaleise = joinCoaleise.map((item) => {
        const [tableName, fieldName] = item.split('.');
        const replaceWith = this.deletedReplacements[`${fieldName}`];
        if (typeof replaceWith === 'undefined') return item;
        return db.raw(`CASE WHEN ${this.table}.deleted THEN :replaceWith ELSE "${tableName}"."${fieldName}" END AS ${fieldName}`, { replaceWith });
      });
    }

    for (const field of Object.keys(this.aliases).filter((l) => joinCoaleise.includes(`${this.table}.${l}`))) {
      joinCoaleise.push(`${this.table}.${field} AS ${this.aliases[`${field}`]}`);
    }

    if (this.lang && this.lang !== 'en') {
      for (const field of this.translate) {
        joinCoaleise.push(db.raw(`COALESCE( (
          select text from langs where lang=:lang and "textKey" = any(
            select "textKey" from langs where lang='en' and text = ${this.table}.${field} 
          ) limit 1), name ) AS ${field}`, { lang: this.lang }));
      }
    }

    const join = f ? this.join.filter(({ table }) => f.includes(table)) : this.join;
    for (const {
      table, schema, as, where, whereBindings, alias, fields, field, limit, orderBy, byIndex,
    } of join) {
      if (!table && field) {
        joinCoaleise.push(db.raw(`${field} AS ${alias || field}`));
        continue;
      }
      const orderByStr = orderBy ? `ORDER BY ${orderBy}` : '';
      const limitStr = limit ? `LIMIT ${limit}` : '';
      const lang = table === 'lang' && this.lang && this.lang.match(/^\w{2}$/) ? `AND lang='${this.lang}'` : '';
      const ff = fields?.map((item) => (typeof item === 'string'
        ? `'${item}', "${as || table}"."${item}"`
        : `'${Object.keys(item)[0]}', ${Object.values(item)[0]}`));
      const f2 = ff ? `json_build_object(${ff.join(', ')})` : `"${as || table}".*`;
      const f3 = field || `jsonb_agg(${f2})`;
      const wb = {};
      if (whereBindings) {
        if (!ctx) continue;
        const { params, query, state } = ctx;
        const dd = flattening({ params, query, token: state.token });
        if (Object.values(whereBindings).filter((item) => !dd[`${item}`]).length) continue;
        for (const [k, v] of Object.entries(whereBindings)) wb[`${k}`] = dd[`${v}`];
      }

      const index = typeof byIndex === 'number' ? `[${byIndex}]` : '';
      const schemaStr = !schema ? '' : `"${schema}".`;

      const coaliseWhere = `COALESCE( ( SELECT ${f3} FROM (
        SELECT * FROM ${schemaStr}"${table}" AS "${as || table}"
        WHERE ${where} ${lang}
        ${orderByStr}
        ${limitStr}
      ) ${as || table})${index}, NULL)`;

      this.coaliseWhere = { ...this.coaliseWhere, [`${alias || table}`]: coaliseWhere };
      this.coaliseWhereReplacements = { ...this.coaliseWhereReplacements, ...wb };

      let sqlToJoin = `${coaliseWhere} AS "${alias || table}"`;
      if (this.includeDeleted && this.deletedReplacements) {
        const replaceWith = this.deletedReplacements[`${table}`] || this.deletedReplacements[`${as}`] || this.deletedReplacements[`${alias}`];
        if (typeof replaceWith !== 'undefined') {
          sqlToJoin = `CASE WHEN ${this.table}.deleted THEN ${replaceWith} ELSE ${coaliseWhere} END AS "${alias || table}"`;
        }
      }

      joinCoaleise.push(db.raw(sqlToJoin, wb));
    }

    if (ctx.request.query._search && this.searchFields.length) {
      const searchColumnsStr = this.searchFields.map((name) => `COALESCE("${name}" <-> :_search, 1)`).join(' + ');
      joinCoaleise.push(db.raw(`(${searchColumnsStr})/${this.searchFields.length} as _search_distance`, ctx.request.query));
    }

    this.res.column(joinCoaleise);
  }

  checkDeleted() {
    if (this.includeDeleted || !this.rows.deleted) return;
    this.res.where({ [`${this.table}.deleted`]: false });
  }

  async isFullAccess({ ctx, where, method }) {
    if (!this.access[`${method}`] && !this.accessByStatuses[`${method}`]) return;
    const { token } = ctx.state;
    const rows = this.getTableRows(ctx);
    let isOwner = false;
    if (where && rows.user_id) {
      isOwner = await this.getDbWithSchema(ctx).where({ ...where, user_id: token.id }).first();
    }
    await userAccess({
      ctx, isOwner, name: this.access[`${method}`], statuses: this.accessByStatuses[`${method}`],
    });
    return true;
  }

  getJoinFields() {
    return this.join.reduce((acc, { alias, table, field }) => {
      let type = !field && 'ARRAY';
      if (!type) type = field.match(/::bool$/) && 'boolean';
      if (!type) type = field.match(/::int$/) && 'integer';
      if (!type) type = 'string';

      acc[alias || table] = type;
      return acc;
    }, {});
  }

  /** return data from table. Use '_fields', '_sort', '_start', '_limit' options
 * examples:
 * - second page, 1 record per page, sort by title desc, only id and title fields:
 *   /ships?_fields=id,title&_sort=-title&_page=2&_limit=1
 * - skip 100 records, get next 10 records: /ships?_skip=100&_limit=10
 * - search by id and title: /ships?_fields=title&id=2&title=second data
 * - search by multiply ids: /ships?_fields=id&id=1&id=3
 * - search where not: /ships?_fields=title&title!=_e%25 d_ta
 * - search by 'like' mask: /ships?_fields=title&title~=_e%25 d_ta
 * - search from-to: /ships?_from_year=2010&_to_year=2020
 */

  optionsGet() {
    const fields = {};
    const fieldsSearchLike = {};
    const fieldsFromTo = {};
    const fieldsNull = {};
    for (const [key, data] of Object.entries(this.tableInfo || {})) {
      fields[`${key}`] = data.data_type;
      if (data.data_type === 'string') fieldsSearchLike[`${key}~`] = data.data_type;
      if (data.is_nullable === 'YES') {
        fieldsNull[`_null_${key}`] = 'string';
        fieldsNull[`_not_null_${key}`] = 'string';
      }
      if (data.data_type !== 'boolean' && data.data_type !== 'file') {
        fieldsFromTo[`_from_${key}`] = data.data_type;
        fieldsFromTo[`_to_${key}`] = data.data_type;
      }
    }

    const queryParameters = {
      ...fields,
      ...fieldsSearchLike,
      ...fieldsNull,
      ...fieldsFromTo,
      _fields: {
        type: 'string',
        example: 'id,name',
      },
      _sort: {
        type: 'string',
        example: '-timeCreated,name,random()',
      },
      _limit: 'integer',
      _page: 'integer',
      _skip: 'integer',
      ...(this.searchFields.length && { _search: 'string' }),
    };
    return {
      tokenRequired: this.tokenRequired.get || this.access.read || this.accessByStatuses.read,
      ownerRequired: this.ownerRequired.get,
      rootRequired: this.rootRequired.get,
      joinFields: this.getJoinFields(),
      cache: this.cache,
      queryParameters,
    };
  }

  async get({ ctx }) {
    if (this.tokenRequired.get) await checkToken(ctx);
    if (this.ownerRequired.get) await checkOwnerToken(ctx);
    if (this.rootRequired.get) await checkRootToken(ctx);

    await this.isFullAccess({ ctx, method: 'read' });

    const { db, token } = ctx.state;
    this.token = token;

    const {
      _fields, _sort, _page, _skip, _limit, _unlimited, _lang, _isNull, _or, _search, ...where
    } = ctx.request.query;

    if (_lang) this.lang = _lang;
    this.rows = this.getTableRows(ctx);
    this.res = this.getDbWithSchema(ctx);

    const { user_id } = await this.res.clone().first() || {};
    this.isOwner = token?.id && token.id === user_id;

    if (_or) this.res.where(function () { [].concat(_or).map((key) => this.orWhere(key)); });
    if (_isNull) [].concat(_isNull).map((key) => this.res.andWhereNull(key));

    this.fields({ ctx, _fields, db });

    this.where(Object.entries({ ...this.defaultWhere, ...where }).reduce((acc, [cur, val]) => ({ ...acc, [`${cur}`]: val }), {}));

    if (_search && this.searchFields.length) {
      const whereStr = this.searchFields.map((name) => `"${name}" % :_search`).join(' OR ');
      this.res.andWhere(function () {
        this.whereRaw(whereStr, { _search });
      });
      if (!_sort) this.res.orderBy('_search_distance', 'ASC');
    }

    this.checkDeleted();

    const total = +(await db.from({ w: this.res }).count('*'))[0].count;

    this.sort(_sort, db);
    this.pagination({
      _page, _skip, _limit, _unlimited,
    });
    // if (_or) console.log(this.res.toSQL())
    const data = await this.res;
    const limit = +_limit;
    return {
      total,
      limit,
      skip: +_skip,
      page: +_page,
      pages: !limit ? 1 : Math.ceil(total / limit),
      data,
    };
  }

  optionsGetById() {
    return {
      tokenRequired: this.tokenRequired.get || this.access.read || this.accessByStatuses.read,
      ownerRequired: this.ownerRequired.get,
      rootRequired: this.rootRequired.get,
      joinFields: this.getJoinFields(),
      cache: this.cache,
    };
  }

  async getById({ ctx }) {
    if (this.tokenRequired.get) await checkToken(ctx);
    if (this.ownerRequired.get) await checkOwnerToken(ctx);
    if (this.rootRequired.get) await checkRootToken(ctx);

    await this.isFullAccess({ ctx, method: 'read' });

    const { db, token } = ctx.state;
    const { id } = ctx.params;

    const {
      _fields, _lang, _or, ...whereWithParams
    } = ctx.request.query;
    const where = Object.keys(whereWithParams).reduce(
      (acc, key) => {
        if (key[0] !== '_') acc[`${key}`] = whereWithParams[`${key}`];
        return acc;
      },
      {},
    );

    this.token = token;
    this.lang = _lang;

    this.rows = this.getTableRows(ctx);
    this.res = this.getDbWithSchema(ctx);

    if (_or) this.res.where(function () { [].concat(_or).map((key) => this.orWhere(key)); });
    this.where({ ...where, [`${this.table}.id`]: id });

    this.checkDeleted();

    const { id: tokenId } = token || {};
    const { user_id } = await this.res.clone().first() || {};
    this.isOwner = tokenId && tokenId === user_id;

    this.fields({ ctx, _fields, db });
    return this.res.first();
  }

  updateIncomingData(ctx, data) {
    return Array.isArray(data) ? data.map((item) => this.updateData(ctx, item))
      : this.updateData(ctx, data);
  }

  updateData(ctx, data) {
    const { token } = ctx.state;
    let result = { ...data };
    const rows = this.getTableRows(ctx);

    for (const [key, error_code] of Object.entries(this.required)) {
      if (!result[`${key}`]) throw new Error(error_code);
    }

    for (const key of this.forbiddenFieldsToAdd) {
      delete result[`${key}`];
    }

    result = { ...ctx.params, ...result };

    for (const r of Object.keys(result)) {
      if (rows[`${r}`] && typeof result[`${r}`] !== 'undefined') continue;
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
      tokenRequired: this.tokenRequired.add
        || this.access.create
        || this.accessByStatuses.create,
      ownerRequired: this.ownerRequired.add,
      rootRequired: this.rootRequired.add,
      schema,
    };
  }

  async add({ ctx }) {
    if (this.tokenRequired.add) await checkToken(ctx);
    if (this.ownerRequired.add) await checkOwnerToken(ctx);
    if (this.rootRequired.add) await checkRootToken(ctx);

    await this.isFullAccess({ ctx, method: 'create' });

    const bodyKeys = Object.keys(ctx.request.body);
    const looksLikeArray = bodyKeys.length && bodyKeys.every((j, i) => i === +j);
    const body = looksLikeArray ? Object.values(ctx.request.body) : ctx.request.body;

    const data = this.updateIncomingData(ctx, body);

    Object.keys(data).map((key) => (data[`${key}`] = data[`${key}`] ?? null));

    let result = await this.getDbWithSchema(ctx).insert(data).returning('*');

    // SQLite fix
    if (Number.isInteger(result[0])) result = this.getDbWithSchema(ctx).where({ id: result[0] });

    return result[0];
  }

  optionsUpdate() {
    const schema = Object.entries(this.tableInfo || {}).reduce((acc, [key, data]) => {
      const keyForbiddeen = this.forbiddenFieldsToAdd.includes(key);
      return keyForbiddeen ? acc : { ...acc, [key]: data };
    }, {});

    return {
      tokenRequired: this.tokenRequired.update
        || this.access.update
        || this.accessByStatuses.update,
      ownerRequired: this.ownerRequired.update,
      rootRequired: this.rootRequired.update,
      schema,
    };
  }

  async update({ ctx }) {
    if (this.tokenRequired.update) await checkToken(ctx);
    if (this.ownerRequired.update) await checkOwnerToken(ctx);
    if (this.rootRequired.update) await checkRootToken(ctx);

    const { db, token } = ctx.state;
    const where = { ...ctx.params };
    const rows = this.getTableRows(ctx);

    let needToCheckUserId = rows.user_id && token.id !== -1;
    if (await this.isFullAccess({ ctx, where, method: 'update' })) needToCheckUserId = false;

    if (rows.deleted) where.deleted = false;
    if (needToCheckUserId) where.user_id = token.id;
    else delete where.user_id;

    const data = { ...ctx.request.body };

    for (const key of this.forbiddenFieldsToAdd) {
      delete data[`${key}`];
    }

    if (rows.timeUpdated) data.timeUpdated = db.fn.now();
    // Depricated
    if (rows.time_updated) data.time_updated = db.fn.now();

    await this.getDbWithSchema(ctx).update(data).where(where);
    return this.getById({ ctx });
  }

  optionsDelete() {
    return {
      tokenRequired: this.tokenRequired.delete
        || this.access.delete
        || this.accessByStatuses.delete,
      ownerRequired: this.ownerRequired.delete,
      rootRequired: this.rootRequired.delete,
    };
  }

  async delete({ ctx }) {
    if (this.tokenRequired.delete) await checkToken(ctx);
    if (this.ownerRequired.delete) await checkOwnerToken(ctx);
    if (this.rootRequired.delete) await checkRootToken(ctx);

    const { token } = ctx.state;
    const where = { ...ctx.params };
    const rows = this.getTableRows(ctx);

    let needToCheckUserId = rows.user_id && token.id !== -1;
    if (await this.isFullAccess({ ctx, where, method: 'delete' })) needToCheckUserId = false;

    if (rows.deleted) where.deleted = false;
    if (needToCheckUserId) where.user_id = token.id;
    else delete where.user_id;

    const t = this.getDbWithSchema(ctx).where(where);
    return rows.deleted ? t.update({ deleted: true }) : t.delete();
  }
}

module.exports = KoaKnexHelper;
