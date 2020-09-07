module.exports = (name, app, controller, links, security,
  updateGet, updateGetOne, updatePost, updateDelete, updatePut, updatePatch) => {
  const c = controller(name, undefined, {
    updateGet, updateGetOne, updatePost, updateDelete, updatePut, updatePatch,
  });

  const path = `/${name}`;
  const pathId = `${path}/:id`;

  app.get(path, c.get);
  app.post(path, c.post);
  app.delete(path, c.delete);

  app.get(pathId, c.get);
  app.patch(pathId, c.update);
  app.put(pathId, c.replace);
  app.delete(pathId, c.delete);

  if (links) {
    for (const link of [].concat(links)) {
      const c1 = controller(name, link, {
        updateGet, updateGetOne, updatePost, updateDelete, updatePut, updatePatch,
      });
      const c2 = controller(link, name, {
        updateGet, updateGetOne, updatePost, updateDelete, updatePut, updatePatch,
      });
      const pathIdlinked1 = `/${name}/:id/${link}`;
      const pathIdlinked2 = `/${link}/:id/${name}`;

      app.get(pathIdlinked1, c1.get);
      app.get(pathIdlinked2, c2.get);
      app.post(pathIdlinked1, c1.post);
      app.post(pathIdlinked2, c2.post);
    }
  }
};
