module.exports = ({ models, log }) => {
  // insert linked data if it is exists in linked table, store it in delayed otherwise
  async function processLinked(ctx) {
    const prefix = new RegExp('^([^/]+)/([^/]+)/([^/]+)$');

    await Promise.all(Object.keys(ctx.delayedData).map(async (link) => {
      if (!ctx.delayedData[link]) return;

      const [, table1, id1, table2] = link.match(prefix);

      const result1 = (await models.get({ name: table1, where: { id: id1 } })).shift();

      const data2 = await Promise.all(ctx.delayedData[link].map(async (item) => {
        const result2 = (await models.get({ name: table2, where: item })).shift();
        if (!result1 || !result2) return item;
        await models.insert(
          models.getLinkedTableName(table1, table2),
          { [table1]: result1.id, [table2]: result2.id },
        );
        return undefined;
      }));

      const result = data2.filter((item) => item && Object.keys(item).length);
      ctx.delayedData[link] = result.length && result;
    }));

    if (Object.keys(ctx.delayedData).length) log.info('delayed linked data:', ctx.delayedData);
  }

  return (name, link, {
    updateGet, updateGetOne, updatePost, updateDelete, updatePut, updatePatch,
  } = {}) => ({
    get: async (ctx) => {
      const { id } = ctx.params;
      const { updateQuery } = ctx.config || {};
      const query = updateQuery ? updateQuery(ctx.request.query) : ctx.request.query;
      const where = id ? { id } : {};
      const like = {};
      const regex = {};

      const fieldAliases = {
        filter: 'fields',
        order: 'sort',
        start: 'offset',
        begin: 'offset',
        per_page: 'limit',
      };

      const search = Object.keys(query).filter((key) => !key.match(/^_/));

      for (const key of search) {
        const word = query[key];
        if (word.match(/^:/)) like[key] = word.substr(1);
        else if (word.match(/^~/)) regex[key] = word.substr(1);
        else where[key] = word;
      }

      const options = Object.keys(query)
        .filter((key) => key.match(/^_/))
        .reduce((obj, key) => ({ ...obj, [key.substr(1)]: query[key] }), {});

      // update aliases
      for (const [name1, name2] of Object.entries(fieldAliases)) {
        if (options[name1]) options[name2] = options[name1];
      }

      if (options.page && options.limit) options.offset = options.page * options.limit;

      const data = await models.get({
        name, link, where, like, regex, ...options,
      });

      if (id && !link && !data[0]) throw new Error('NOT_FOUND');

      let dataOne = id && !link && data[0];
      dataOne = updateGetOne && dataOne ? updateGetOne(dataOne) : dataOne;
      const modifiedData = updateGet && updateGet(data);
      const globalModifiedData = ctx.config && ctx.config.updateGet && ctx.config.updateGet(data);
      ctx.body = dataOne || modifiedData || globalModifiedData || data;
    },

    post: async (ctx) => {
      const { body } = ctx.request;
      const currentSchema = models.schema[name] || {};

      if (link) {
        const { id } = ctx.params;
        body[name] = body[name] ? [].concat(body[name], +id) : [+id];
        body[name] = body[name].filter((value, index, s) => s.indexOf(value) === index);
      }
      const linkedData = {};

      // store linked data
      for (const [key, search] of Object.entries(body)) {
        if (key === 'id' || currentSchema[key] || !models.schema[key]) continue;
        linkedData[key] = [].concat(search).map((id) => (typeof id === 'number' ? { id } : id));
        delete body[key];
      }

      const realName = link || name;
      const result1 = await models.insert(realName, body);

      for (const [table2, data2] of Object.entries(linkedData)) {
        const key = `${realName}/${result1.id}/${table2}`;
        ctx.delayedData[key] = (ctx.delayedData[key] || []).concat(data2);
      }

      await processLinked(ctx);

      ctx.status = 201;
      ctx.location = `/${realName}/${result1.id}`;
      ctx.body = updatePost ? updatePost(result1) : result1;
    },

    replace: async (ctx) => {
      await models.replace(name, ctx.params.id, ctx.request.body);
      ctx.body = updatePut ? updatePut(ctx.params) : ctx.params;
    },

    update: async (ctx) => {
      const result = await models.update(name, ctx.params.id, ctx.request.body);
      ctx.body = updatePatch ? updatePatch(result) : result;
    },

    delete: async (ctx) => {
      const result = await models.delete(name, ctx.params.id);
      ctx.body = updateDelete ? updateDelete(result) : result;
    },

  });
};
