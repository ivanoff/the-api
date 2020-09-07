const LoginModel = require('./login');

class Models {
  constructor(db) {
    this.db = db;
    this.schema = {};
    this.getLinkedTableName = (...tables) => tables.sort().join('_');
    this.login = new LoginModel(this.db);
  }

  async checkConnection(tries = 10, timeout = 1000) {
    if (!tries) throw ('Database connection error');
    try {
      await this.db.raw('SELECT 1+1');
    } catch (err) {
      await new Promise((resolve) => {
        setTimeout(() => resolve(this.checkConnection(tries - 1, timeout)), timeout);
      });
    }
  }

  async create(name, schema, links) {
    const columnInfo = await this.db.table(name).columnInfo();

    if (schema && !Object.keys(columnInfo).length) {
      // TO-DO check schema and columnInfo
      // if (Object.keys(columnInfo).length) throw 'TABLE_EXISTS';

      await this.db.schema.createTable(name, (table) => {
        table.increments('id');
        table.timestamps();
        // look Adds an integer column at knexjs.org

        for (const [key, type] of Object.entries(schema)) {
          const k = table[type.type || type](key);
          // Update parameters
          if (type.required) k.notNullable();
        }
      });
    }

    this.schema[name] = schema || columnInfo;

    // create link table
    if (links) {
      const jobs = [];
      for (const link of [].concat(links)) {
        jobs.push(this.createTable({ name, link }));
      }
      await Promise.all(jobs);
    }
  }

  async createTable({ name, link }) {
    const tableName = this.getLinkedTableName(name, link);
    if (await this.db.schema.hasTable(tableName)) return;
    await this.db.schema.createTable(tableName, (table) => {
      table.increments();
      table.integer(name);
      table.integer(link);
    });
  }

  async get({
    name, link, where, like, regex, limit, offset, fields, sort,
  }) {
    const w = where;
    let r;
    if (link) {
      const tableName = this.getLinkedTableName(name, link);
      w[`${tableName}.${name}`] = w.id;
      delete w.id;
      r = this.db(tableName).select(`${link}.*`).leftJoin(link, `${link}.id`, `${tableName}.${link}`);
    } else {
      r = this.db(name);
    }

    r.where(where);

    if (like) for (const k of Object.keys(like)) r.where(k, 'like', like[k]);
    if (regex) for (const k of Object.keys(regex)) r.where(k, 'REGEXP', regex[k]);

    r.select(fields || '*');

    if (limit) r.limit(limit);
    if (offset) r.offset(offset);

    if (sort) {
      const desc = sort[0] === '-';
      r.orderBy(sort.replace(/^-/, ''), desc ? 'desc' : 'asc');
    }

    return r;
  }

  async insert(name, body) {
    const r = await this.db(name).insert(body).returning('*');
    return { id: r[0] };
    // return typeof r[0] === 'number'? {id: r[0]} : r[0];
  }

  async update(name, id, body) {
    return this.db(name).update(body).where({ id });
  }

  async replace(name, id, body) {
    return this.db.transaction(async (trx) => {
      try {
        await this.db(name).transacting(trx).where({ id }).delete();
        await this.db(name).transacting(trx).insert({ ...body, id });
        await trx.commit();
      } catch (err) {
        await trx.rollback(err);
      }
    });
  }

  async delete(name, id) {
    return this.db(name).where({ id }).delete();
  }
}

module.exports = Models;
