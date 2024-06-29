import flattening from 'flattening';
import type { CrudBuilderOptionsType, CrudBuilderPermissionsType, DbTablesType, MethodsType, getResultType, metaType, stringRecordType, whereParamsType } from "./types";
import type { Context } from 'hono';
import type { Knex } from 'knex';

export default class CrudBuilder {
  c?: Context;
  table: any;
  schema: any;
  aliases: stringRecordType;
  join: any;
  joinOnDemand: any;
  leftJoin: any;
  leftJoinDistinct: any;
  lang: any;
  translate: any;
  searchFields: any;

  requiredFields: any;
  defaultWhere: any;
  defaultWhereRaw: any;
  defaultSort: any;
  sortRaw: any;
  fieldsRaw: any;
  tokenRequired: any;
  ownerRequired: any;
  rootRequired: any;
  access: any;
  accessByStatuses: any;
  deletedReplacements: any;
  includeDeleted: boolean;

  hiddenFields?: string[];
  readOnlyFields?: string[];
  permissionViewableFields?: Record<string, string[]>;
  permissionEditableFields?: Record<string, string[]>;
  showFieldsByPermission?: Record<string, string[]>;
  permissionCheckedMethods?: (MethodsType | '*')[];
  replacedOwnerPermissions?: string[];

  cache: any;
  userIdFieldName: any;
  additionalFields: any;
  apiClientMethodNames: any;
  
  dbTables: DbTablesType;
  coaliseWhere: any;
  langJoin: any = {};
  coaliseWhereReplacements: any;
  user?: any;
  res: any;
  isOwner?: boolean;
  rows: any;
  relations?: Record<string, CrudBuilderOptionsType>;
  roles: any;
  permissions?: CrudBuilderPermissionsType;
  ownerPermissions: Record<string, boolean>;

  constructor({
    c,
    table,
    schema,
    aliases,
    join,
    joinOnDemand,
    leftJoin,
    leftJoinDistinct,
    lang,
    translate,
    searchFields,
    hiddenFields,
    readOnlyFields,
    permissions,
    requiredFields,
    defaultWhere,
    defaultWhereRaw,
    defaultSort,
    sortRaw,
    fieldsRaw,
    tokenRequired,
    ownerRequired,
    rootRequired,
    access,
    accessByStatuses,
    dbTables,
    deletedReplacements,
    includeDeleted,
    cache,
    userIdFieldName,
    additionalFields,
    apiClientMethodNames,
    relations,
  }: CrudBuilderOptionsType) {
    this.c = c;
    this.table = table;
    this.schema = schema || 'public';
    this.aliases = aliases || {};
    this.join = join || [];
    this.joinOnDemand = joinOnDemand || [];
    this.leftJoin = leftJoin || [];
    this.leftJoinDistinct = !!leftJoinDistinct;
    this.lang = lang || 'en';
    this.translate = translate || [];
    this.showFieldsByPermission = permissions?.fields?.viewable || {};
    this.ownerPermissions = permissions?.owner?.reduce((acc, cur) => ({ ...acc, [cur]: true }) ,{}) || {};
    this.readOnlyFields = readOnlyFields || ['id', 'timeCreated', 'timeUpdated', 'timeDeleted', 'isDeleted'];
    this.requiredFields = requiredFields || {};
    this.defaultWhere = defaultWhere || {};
    this.defaultWhereRaw = defaultWhereRaw;
    this.defaultSort = defaultSort;
    this.sortRaw = sortRaw;
    this.fieldsRaw = fieldsRaw;
    this.tokenRequired = tokenRequired?.reduce((acc: any, cur: any) => ({ ...acc, [cur]: true }), {}) || {};
    this.ownerRequired = ownerRequired?.reduce((acc: any, cur: any) => ({ ...acc, [cur]: true }), {}) || {};
    this.rootRequired = rootRequired?.reduce((acc: any, cur: any) => ({ ...acc, [cur]: true }), {}) || {};
    this.access = access || {};
    this.accessByStatuses = accessByStatuses || {};
    this.searchFields = searchFields || [];
    this.dbTables = dbTables || {};
    this.deletedReplacements = deletedReplacements;
    this.includeDeleted = typeof includeDeleted === 'boolean' ? includeDeleted : !!this.deletedReplacements;
    this.hiddenFields = hiddenFields || [];
    this.coaliseWhere = {};
    this.coaliseWhereReplacements = {};
    this.cache = cache;
    this.userIdFieldName = userIdFieldName || 'userId';
    this.additionalFields = additionalFields || {};
    this.apiClientMethodNames = apiClientMethodNames || {};
    this.relations = relations;
  }

  getDbWithSchema(db: Knex<any, unknown[]>) {
    const result = db(this.table);
    if (this.schema) result.withSchema(this.schema);
    return result;
  }

  getTableRows(c: Context) {
    return c.env.dbTables[`${this.schema}.${this.table}`] || {};
  }

  sort(sort: any, db: any) {
    if (this.sortRaw) this.res.orderByRaw(this.sortRaw);

    const _sort = sort || this.defaultSort;
    if (!_sort) return;

    _sort.split(',').forEach((item: any) => {
      if (item.match(/^random\(\)$/i)) return this.res.orderBy(db.raw('RANDOM()'));

      const match = item.match(/^(-)?(.*)$/);
      this.res.orderBy(match[2], match[1] && 'desc');
    });
  }

  pagination({
    _page, _skip = 0, _limit, _unlimited,
  }: any) {

    const isUnlimited = _unlimited === 'true' || _unlimited === true;
    if (!_limit || isUnlimited) return;

    this.res.limit(_limit);
    const offset = _page ? (_page - 1) * _limit : 0;
    this.res.offset(offset + (+_skip));
  }

  whereNotIn(whereNotInObj: any) {
    if (!whereNotInObj) return;

    for (const [key, value] of Object.entries(whereNotInObj)) {
      this.res.whereNotIn(key, value);
    }
  }

  where(whereObj: any, db: any) {
    if (!whereObj) return;

    for (const [key, value] of Object.entries(whereObj)) {
      if (this.langJoin[`${key}`]) {
        this.res.whereRaw(`${this.langJoin[`${key}`]} = :_value`, { _value: value, lang: this.lang });
      } else if (this.coaliseWhere[`${key}`] || this.coaliseWhere[`${key.replace(/!$/, '')}`]) {
        const key2 = key.replace(/!$/, '');
        const isNnot = key.match(/!$/) ? 'NOT' : '';
        const coaliseWhere = this.coaliseWhere[`${key2}`];
        const replacements = this.coaliseWhereReplacements;
        if (Array.isArray(value)) {
          for (const _value of value) {
            this.res.orWhere(function (this: Knex.QueryBuilder) {
              this.whereRaw(`${isNnot} ${coaliseWhere} = :_value`, { ...replacements, _value });
            });
          }
        } else {
          this.res.whereRaw(`${isNnot} ${coaliseWhere} = :_value`, { ...replacements, _value: value });
        }
      } else if (key.match(/~$/)) {
        // iLike
        this.res.where(key.replace(/~$/, ''), 'ilike', value);
      } else if (key.match(/!$/)) {
        if (Array.isArray(value)) {
          this.res.whereNotIn(key.replace(/!$/, ''), value);
        } else {
          this.res.whereNot(key.replace(/!$/, ''), value);
        }
      } else if (key.match(/^_null_/)) {
        const m = key.match(/^_null_(.+)$/);
        this.res.whereNull(m?.[1]);
      } else if (key.match(/^_in_/)) {
        try {
          const m = key.match(/^_in_(.+)$/);
          this.res.whereIn(m?.[1], JSON.parse(value as any));
        } catch {
          throw new Error('ERROR_QUERY_VALUE')
        }
      } else if (key.match(/^_not_in_/)) {
        try {
          const m = key.match(/^_not_in_(.+)$/);
          this.res.whereNotIn(m?.[1], JSON.parse(value as any));
        } catch {
          throw new Error('ERROR_QUERY_VALUE')
        }
      } else if (key.match(/^_not_null_/)) {
        const m = key.match(/^_not_null_(.+)$/);
        this.res.whereNotNull(m?.[1]);
      } else if (key.match(/_(from|to)_/)) {
        if (value !== '') {
          const m = key.match(/_(from|to)_(.+)$/);
          const sign = m?.[1] === 'from' ? '>=' : '<=';

          const coaliseWhere = this.coaliseWhere[`${m?.[2]}`];
          if (coaliseWhere) {
            this.res.whereRaw(`${coaliseWhere} ${sign} ?`, [value]);
          } else {
            this.res.where(`${m?.[2]}`, sign, value);
          }
        }
      } else if (Array.isArray(value)) {
        this.res.whereIn(key, value);
      } else if (value === null) {
        this.res.whereNull(key);
      } else if (this.leftJoin && !key.includes('.')) {
        this.res.where({ [`${this.table}.${key}`]: value });
      } else {
        this.res.where(key, value);
      }
    }
  }

  getHiddenFields() {
    if (!this.roles) return { regular: this.hiddenFields, owner: this.hiddenFields };

    const permissions = this.roles.getPermissions(this.user?.roles);

    let toShow: string[] = [];
    let ownerToShow: string[] = [];
    for (const [key, value] of Object.entries(this.showFieldsByPermission)) {
      const hasPermission = this.roles.checkWildcardPermissions({ key, permissions });
      if (hasPermission) toShow = toShow.concat(value);
      
      const ownerHasPermission = this.roles.checkWildcardPermissions({ key, permissions: this.ownerPermissions });
      if (ownerHasPermission) ownerToShow = ownerToShow.concat(value);
    }

    const regular = this.hiddenFields?.filter((item) => !toShow.includes(item)) || [];
    const owner = this.hiddenFields?.filter((item) => !ownerToShow.includes(item)) || [];

    return { regular, owner };
  }

  fields({
    c, _fields, _join, db, _sort,
  }: any) {
    // this.updatehiddenFields(this.hiddenFields);
    let f = _fields && _fields.split(',');

    if (this.leftJoin.length) {
      this.leftJoin.map((item: any) => this.res.leftJoin(...item));

      if (this.leftJoinDistinct) {
        const sortArr = (_sort || this.defaultSort || '').replace(/(^|,)-/g, ',').split(',').filter(Boolean);
        this.res.distinct(!f ? [] : sortArr.map((item: any) => !f.includes(item) && `${this.table}.${item}`).filter(Boolean));
      }
    }

    let join = [...this.join];

    if (_join) {
      const joinNames = Array.isArray(_join) ? _join : _join.split(',');
      for (const joinName of joinNames) {
        const toJoin = this.joinOnDemand.filter(({ table, alias }: any) => joinName === alias || joinName === table );
        if (toJoin.length) join = join.concat(toJoin.filter((j: any) => !join.find(({ table, alias }) => table === j.table && alias === j.alias)));
      }
    }

    if (f) {
      join = join.filter(({ table, alias }: any) => f.includes(table) || f.includes(alias));
      f = f.filter((name: string) => !join.find(({ table, alias}: any) => name === table || name === alias));
    }

    let joinCoaleise = (f || Object.keys(this.rows))
      // .filter((name: any) => !this.hiddenFields.includes(name))
      .map((l: any) => `${this.table}.${l}`);

    if (this.includeDeleted && this.deletedReplacements && this.rows.isDeleted) {
      joinCoaleise = joinCoaleise.map((item: any) => {
        const [tableName, fieldName] = item.split('.');
        const replaceWith = this.deletedReplacements[`${fieldName}`];
        if (typeof replaceWith === 'undefined') return item;
        return db.raw(`CASE WHEN "${this.table}"."isDeleted" THEN :replaceWith ELSE "${tableName}"."${fieldName}" END AS ${fieldName}`, { replaceWith });
      });
    }

    for (const field of Object.keys(this.aliases)) {
      joinCoaleise.push(`${this.table}.${field} AS ${this.aliases[`${field}`]}`);
    }

    if (this.lang && this.lang !== 'en') {
      for (const field of this.translate) {
        this.langJoin[`${field}`] = `COALESCE( (
          select text from langs where lang=:lang and "textKey" = any(
            select "textKey" from langs where lang='en' and text = "${this.table}"."${field}" 
          ) limit 1), name )`;
        joinCoaleise.push(db.raw(this.langJoin[`${field}`] + `AS "${field}"`, { lang: this.lang }));
      }
    }

    for (const {
      table, schema, as, where, whereBindings, alias, defaultValue, fields,
      field, limit, orderBy, byIndex, leftJoin,
    } of join) {
      if (!table && field) {
        joinCoaleise.push(db.raw(`${field} AS ${alias || field}`));
        continue;
      }

      const orderByStr = orderBy ? `ORDER BY ${orderBy}` : '';
      const limitStr = limit ? `LIMIT ${limit}` : '';
      const lang = table === 'lang' && this.lang && this.lang.match(/^\w{2}$/) ? `AND lang='${this.lang}'` : '';
      const ff = fields?.map((item: any) => (typeof item === 'string'
        ? `'${item}', "${as || table}"."${item}"`
        : `'${Object.keys(item)[0]}', ${Object.values(item)[0]}`));
      const f2 = ff ? `json_build_object(${ff.join(', ')})` : `"${as || table}".*`;
      const f3 = field || `jsonb_agg(${f2})`;
      const wb: any = {};
      if (whereBindings) {
        if (!c) continue;
        const envAll = c.env;
        const query = c.req.query();
        const params = c.req.param();
    
        const env = { ...envAll };
        [
          'db',
          'dbWrite',
          'dbTables',
          'error',
          'getErrorByMessage',
          'log',
        ].map((key) => delete env[`${key}`]);

        const dd: any = flattening({ env, params, query });

        if (Object.values(whereBindings).filter((item: any) => !dd[`${item}`]).length) continue;
        for (const [k, v] of Object.entries(whereBindings)) wb[`${k}`] = dd[`${v}`];
      }

      const leftJoinStr = !leftJoin ? ''
        : typeof leftJoin === 'string' ? `LEFT JOIN ${leftJoin}`
          : `LEFT JOIN "${leftJoin[0]}" ON ${leftJoin[1]} = ${leftJoin[2]}`;

      const index = typeof byIndex === 'number' ? `[${byIndex}]` : '';
      const schemaStr = !schema ? '' : `"${schema}".`;
      const dValue = defaultValue ? `'${defaultValue}'` : 'NULL';

      const coaliseWhere = `COALESCE( ( SELECT ${f3} FROM (
        SELECT * FROM ${schemaStr}"${table}" AS "${as || table}"
        ${leftJoinStr}
        WHERE ${where} ${lang}
        ${orderByStr}
        ${limitStr}
      ) "${as || table}")${index}, ${dValue})`;

      this.coaliseWhere = { ...this.coaliseWhere, [`${alias || table}`]: coaliseWhere };
      this.coaliseWhereReplacements = { ...this.coaliseWhereReplacements, ...wb };

      let sqlToJoin = `${coaliseWhere} AS "${alias || table}"`;
      if (this.includeDeleted && this.deletedReplacements && this.rows.isDeleted) {
        const replaceWith = this.deletedReplacements[`${table}`] || this.deletedReplacements[`${as}`] || this.deletedReplacements[`${alias}`];
        if (typeof replaceWith !== 'undefined') {
          sqlToJoin = `CASE WHEN "${this.table}"."isDeleted" THEN ${replaceWith} ELSE ${coaliseWhere} END AS "${alias || table}"`;
        }
      }

      joinCoaleise.push(db.raw(sqlToJoin, wb));
    }

    if (c.req.query()._search && this.searchFields.length) {
      const searchColumnsStr = this.searchFields.map((name: any) => {
        const searchName = this.langJoin[`${name}`] || `"${name}"`;
        return `COALESCE(${searchName} <-> :_search, 1)`;
        // return `COALESCE(${searchName} <-> :_search, 1) + COALESCE("${name}" <-> :_search, 1)`;
      }).join(' + ');
      joinCoaleise.push(db.raw(`(${searchColumnsStr})/${this.searchFields.length} as _search_distance`, {...c.req.query(), lang: this.lang }));
      if (!_sort) this.res.orderBy('_search_distance', 'ASC');
    }

    this.res.column(joinCoaleise.concat(this.fieldsRaw || []));
  }

  checkDeleted() {
    if (this.includeDeleted || !this.rows.isDeleted) return;
    this.res.where({ [`${this.table}.isDeleted`]: false });
  }

  getJoinFields() {
    return this.join.reduce((acc: any, { alias, table, field }: any) => {
      let type = !field && 'ARRAY';
      if (!type) type = field.match(/::bool$/) && 'boolean';
      if (!type) type = field.match(/::int$/) && 'integer';
      if (!type) type = 'string';

      acc[alias || table] = type;
      return acc;
    }, {});
  }

  deleteHiddenFieldsFromResult(result: any, hiddenFields: any) {
    if (!hiddenFields) return;

    const isOwner = this.user?.id && result[`${this.userIdFieldName}`] === this.user?.id;
    hiddenFields[isOwner ? 'owner' : 'regular'].map((key: string) => delete result[`${key}`]);
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
    const fields: any = {};
    const fieldsSearchLike: any = {};
    const fieldsFromTo: any = {};
    const fieldsNull: any = {};
    for (const [key, data] of Object.entries(this.dbTables || {})) {
      if (!data) continue;
      fields[`${key}`] = data.data_type;
      if (data.data_type === 'string') fieldsSearchLike[`${key}~`] = data.data_type;
      if (data.is_nullable === 'YES') {
        fieldsNull[`_null_${key}`] = 'string';
        fieldsNull[`_not_null_${key}`] = 'string';
      }
      if (data.data_type !== 'boolean' && data.data_type !== 'file') {
        fieldsFromTo[`_from_${key}`] = data.data_type;
        fieldsFromTo[`_to_${key}`] = data.data_type;
        fieldsFromTo[`_in_${key}`] = data.data_type;
        fieldsFromTo[`_not_in_${key}`] = data.data_type;
      }
    }

    const queryParameters = {
      ...fields,
      ...fieldsSearchLike,
      ...fieldsNull,
      ...fieldsFromTo,
      ...this.additionalFields?.get,
      _fields: {
        type: 'string',
        example: 'id,name',
      },
      _sort: {
        type: 'string',
        example: '-timeCreated,name,random()',
      },
      _join: {
        type: 'string',
        example: 'table1,alias1',
      },
      _limit: 'integer',
      _page: 'integer',
      _skip: 'integer',
      _lang: 'string',
      ...(this.searchFields.length && { _search: 'string' }),
    };
    return {
      tokenRequired: this.tokenRequired.get || this.access.read || this.accessByStatuses.read,
      ownerRequired: this.ownerRequired.get,
      rootRequired: this.rootRequired.get,
      joinFields: this.getJoinFields(),
      cache: this.cache,
      joinOnDemand: this.joinOnDemand,
      accessByStatuses: this.accessByStatuses.read,
      additionalFields: this.additionalFields.get,
      queryParameters,
      apiClientMethodNames: this.apiClientMethodNames,
    };
  }

  async get(c: Context) {
    const { result, meta } = await this.getRequestResult(c);

    c.set('meta', meta);
    c.set('result', result);
    c.set('relationsData', this.relations);
  }

  async getRequestResult(c: Context, q?: Record<string, string[]>): Promise<getResultType> {
    const { db, roles } = c.env;
    const { user } = c.var;

    this.roles = roles;
    this.user = user;

    const queries = q || c.req.queries();
    let queriesWithoutArrays: any = {};
    for (const [queryName, queryValue] of Object.entries(queries)) {
      queriesWithoutArrays[`${queryName}`] = queryValue?.length === 1 ? queryValue[0] : queryValue;
    }

    const {
      _fields, _sort, _page, _skip, _limit, _unlimited, _after,
      _lang, _search, _join, ...where
    } = queriesWithoutArrays;

    if (_lang) this.lang = _lang;
    this.rows = this.getTableRows(c);
    this.res = this.getDbWithSchema(c.env.db);

    this.fields({ c, _fields, _join, db, _sort });

    // Object.entries({ ...this.defaultWhere, ...where }).map(([cur, val]) => {
    //   const isInt = this.dbTables?.[`${cur}`]?.data_type === 'integer';
    //   const hasNaN = [].concat(val as never).find((item: any) => Number.isNaN(+item));
    //   if (isInt && hasNaN) throw new Error('INTEGER_REQUIRED');
    // });

    this.where({ ...this.defaultWhere, ...where }, db);

    if (this.defaultWhereRaw) {
      const whereStr = this.defaultWhereRaw;
      this.res.andWhere(function (this: Knex.QueryBuilder) {
        this.whereRaw(whereStr);
      });
    }

    if (_search && this.searchFields.length) {
      const whereStr = this.searchFields.map((name: string) => {
        const searchName = this.langJoin[`${name}`] || `"${name}"`;
        return `${searchName} % :_search`;
        // return `${searchName} % :_search OR "${name}" % :_search`;
      }).join(' OR ');
      const lang = this.lang;
      this.res.andWhere(function (this: Knex.QueryBuilder) {
        this.whereRaw(whereStr, { _search, lang });
      });
    }

    this.checkDeleted();

    const total = +(await db.from({ w: this.res }).count('*'))[0].count;

    this.sort(_sort, db);

    const s = _sort || this.defaultSort;
    const sName = s?.replace(/^-/, '')
    if (_after && _limit && s && this.getTableRows(c)[`${sName}`]) {
      this.res.where(sName, s[0] === '-' ? '<' : '>', _after);
      this.res.limit(_limit);
    }

    else this.pagination({
      _page, _skip, _limit, _unlimited,
    });

    // if (_or) console.log(this.res.toSQL())

    const result = await this.res;

    const nextAfterData = result?.at(-1)?.[`${sName}`];
    const addAfterMs = s?.[0] === '-' ? '000' : '999';
    const nextAfter = nextAfterData instanceof Date ? new Date(nextAfterData).toISOString().replace('Z', `${addAfterMs}Z`) : nextAfterData;

    // const { sql, bindings } = this.res.toSQL();
    // const { rows : r } = await db.raw(`EXPLAIN ${sql}`, bindings);
    // const rrr = r.map(rr => Object.values(rr)).join('\n');
    // const r4 = rrr.match(/(Seq Scan.*?\n.*)/);
    // if (
    //   r4
    //   && !r4[1].match(/Seq Scan on users[\s\S]*Filter: \(id = \d\)$/)
    // ) console.log('CHECK SEQ SCAN\n', r4[1]);

    let meta: metaType = { total };
    if (_after) {
      meta = {
        ...meta,
        after: _after,
        nextAfter : nextAfter ? encodeURIComponent(nextAfter) : undefined,
      };
      meta = {
        ...meta,
        isFirstPage: false,
        isLastPage: !result.length || result.length < _limit,
      };
    } else {
      const limit = +_limit;
      const skip = +_skip || 0;
      const page = +_page || 1;
      const pages = !limit ? 1 : Math.ceil((total-skip) / limit);
      meta = {
        ...meta,
        limit,
        skip,
        page,
        pages,
        nextAfter : page === 1 && nextAfter ? encodeURIComponent(nextAfter) : undefined,
        nextPage: page >= pages ? undefined : page + 1,
        isFirstPage: page <= 1,
        isLastPage: page >= pages,
      };
    }

    const hiddenFields = this.getHiddenFields();
    if (hiddenFields) {
      for(let i = 0; i < result.length; i++) {
        this.deleteHiddenFieldsFromResult(result[i], hiddenFields);
      }
    }

    return { result, meta };
  }

  optionsGetById() {
    return {
      tokenRequired: this.tokenRequired.get || this.access.read || this.accessByStatuses.read,
      ownerRequired: this.ownerRequired.get,
      rootRequired: this.rootRequired.get,
      joinFields: this.getJoinFields(),
      joinOnDemand: this.joinOnDemand,
      accessByStatuses: this.accessByStatuses.read,
      additionalFields: this.additionalFields.get,
      cache: this.cache,
      apiClientMethodNames: this.apiClientMethodNames,
    };
  }

  async getById(c: Context) {
    const { db, roles } = c.env;
    this.roles = roles;
    this.user = c.var.user;

    const { id } = c.req.param();

    const {
      _fields, _lang, _join, ...whereWithParams
    } = c.req.query();
    const where = Object.keys(whereWithParams).reduce(
      (acc: any, key: any) => {
        if (key[0] !== '_') {
          const isInt = this.dbTables?.[`${key}`]?.data_type === 'integer';
          const hasNaN = [].concat(whereWithParams[`${key}`] as never).find((item: any) => Number.isNaN(+item));
          if (isInt && hasNaN) throw new Error('INTEGER_REQUIRED');
          acc[`${key}`] = whereWithParams[`${key}`];
        }
        return acc;
      },
      {},
    );

    this.lang = _lang;

    this.rows = this.getTableRows(c);
    this.res = this.getDbWithSchema(c.env.db);

    if (this.dbTables?.id?.data_type === 'integer' && Number.isNaN(+id)) throw new Error('INTEGER_REQUIRED');

    this.where({ ...where, [`${this.table}.id`]: id }, db);

    this.checkDeleted();

    this.fields({
      c, _fields, _join, db,
    });

    const result = await this.res.first();

    this.deleteHiddenFieldsFromResult(result, this.getHiddenFields());

    c.set('result', result);
    c.set('relationsData', this.relations);
  }

  updateIncomingData(c: Context, data: any) {
    return Array.isArray(data) ? data.map((item: any) => this.updateData(c, item))
      : this.updateData(c, data);
  }

  updateData(c: Context, data: any) {
    const { user } = c.var;
    let result = { ...data };
    const rows = this.getTableRows(c);

    for (const [key, error_code] of Object.entries(this.requiredFields)) {
      if (!result[`${key}`]) throw new Error(error_code as string);
    }

    for (const key of this.readOnlyFields) {
      delete result[`${key}`];
    }

    result = { ...c.req.param(), ...result };

    for (const r of Object.keys(result)) {
      if (rows[`${r}`] && typeof result[`${r}`] !== 'undefined') continue;
      delete result[`${r}`];
    }

    if (rows.userId && user) result.userId = user.id;

    return result;
  }

  optionsAdd() {
    const schema = Object.entries(this.dbTables || {}).reduce((acc, [key, data]) => {
      const keyForbiddeen = this.readOnlyFields.includes(key);
      return keyForbiddeen ? acc : { ...acc, [key]: data };
    }, this.additionalFields?.add || {});

    return {
      tokenRequired: this.tokenRequired.add
        || this.access.create
        || this.accessByStatuses.create,
      ownerRequired: this.ownerRequired.add,
      rootRequired: this.rootRequired.add,
      readOnlyFields: this.readOnlyFields,
      requiredFields: Object.keys(this.requiredFields),
      accessByStatuses: this.accessByStatuses.add,
      apiClientMethodNames: this.apiClientMethodNames,
      schema,
    };
  }

  async add(c: Context) {
    const requestBody = await c.req.json();
    const bodyKeys = Object.keys(requestBody);
    const looksLikeArray = bodyKeys.length && bodyKeys.every((j, i) => i === +j);
    const body = looksLikeArray ? Object.values(requestBody) : requestBody;

    const data: any = this.updateIncomingData(c, body);

    for (const key of Object.keys(data)) {
      const isInt = this.dbTables?.[`${key}`]?.data_type === 'integer';
      const hasNaN = [].concat(data[`${key}`]).find((item: any) => item && Number.isNaN(+item));
      if (isInt && hasNaN) throw new Error('INTEGER_REQUIRED');

      data[`${key}`] = data[`${key}`] ?? null;
    }

    const result = await this.getDbWithSchema(c.env.dbWrite).insert(data).returning('*');

    c.set('result', result[0]);
    c.set('relationsData', this.relations);
  }

  optionsUpdate() {
    const schema = Object.entries(this.dbTables || {}).reduce((acc, [key, data]) => {
      const keyForbiddeen = this.readOnlyFields.includes(key);
      return keyForbiddeen ? acc : { ...acc, [key]: data };
    }, this.additionalFields?.update || {});

    return {
      tokenRequired: this.tokenRequired.update
        || this.access.update
        || this.accessByStatuses.update,
      ownerRequired: this.ownerRequired.update,
      rootRequired: this.rootRequired.update,
      readOnlyFields: this.readOnlyFields,
      accessByStatuses: this.accessByStatuses.update,
      additionalFields: this.additionalFields.update,
      apiClientMethodNames: this.apiClientMethodNames,
      schema,
    };
  }

  async update(c: Context) {
    const { db } = c.env;
    const where: whereParamsType = { ...c.req.param() };
    if (this.dbTables?.id?.data_type === 'integer' && Number.isNaN(+where.id)) throw new Error('INTEGER_REQUIRED');

    const rows = this.getTableRows(c);

    if (rows.isDeleted) where.isDeleted = false;

    const data = await c.req.json();

    for (const key of this.readOnlyFields) {
      delete data[`${key}`];
    }

    if (Object.keys(data).length) {
      if (rows.timeUpdated) data.timeUpdated = db.fn.now();

      await this.getDbWithSchema(c.env.dbWrite).update(data).where(where);
    }

    await this.getById(c);
  }

  optionsDelete() {
    return {
      tokenRequired: this.tokenRequired.delete
        || this.access.delete
        || this.accessByStatuses.delete,
      ownerRequired: this.ownerRequired.delete,
      rootRequired: this.rootRequired.delete,
      accessByStatuses: this.accessByStatuses.delete,
      apiClientMethodNames: this.apiClientMethodNames,
    };
  }

  async delete(c: Context) {
    const { user } = c.var;

    const where: whereParamsType = { ...c.req.param() };
    if (this.dbTables?.id?.data_type === 'integer' && Number.isNaN(+where.id)) throw new Error('INTEGER_REQUIRED');

    const rows = this.getTableRows(c);

    if (rows.isDeleted) where.isDeleted = false;

    const t = this.getDbWithSchema(c.env.dbWrite).where(where);
    const result = rows.isDeleted ? await t.update({ isDeleted: true }) : await t.delete();

    c.set('result', { ok: true });
    c.set('meta', { countDeleted: result });
  }
}
