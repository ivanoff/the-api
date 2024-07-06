import flattening from 'flattening';
import { Routings, CrudBuilder } from 'the-api-routings';
import type { CrudBuilderOptionsType, stringRecordType } from 'the-api-routings';
// import type { CrudBuilderOptionsType, stringRecordType } from '../types';

const relationsMiddleware = async (c: any, next: any) => {
    await next();

    const { result, relationsData } = c.var;

    if (!relationsData || !result) return;

    const relations: any = {};

    const findRelations = async ([key, definition]: [string, CrudBuilderOptionsType]) => {
      const crud = new CrudBuilder(definition);

      const flatData: stringRecordType = flattening({ result, relations });
      const searchKey = new RegExp(`\\b${key}(\\.\\d+)?$`);
      const matchPath = ([path, val]: [string, string]) => (path.match(searchKey) && val);
  
      const ids: any = [...new Set(Object.entries(flatData).map(matchPath).filter(Boolean))];
      if (!ids.length) return;
  
      const idName = definition.relationIdName || 'id';
      const { result: data } = await crud.getRequestResult(c, { [idName]: ids });
  
      if (!relations[`${key}`]) relations[`${key}`] = {};
      for (const d of data) {
        const idKey = d[`${idName}`];
        relations[`${key}`][`${idKey}`] = d;
      }
    };

    await Promise.all(Object.entries(relationsData as Record<string, CrudBuilderOptionsType>).map(findRelations));

    c.set('relations', relations);
};

const relationsRoute = new Routings();
relationsRoute.use('*', relationsMiddleware);

export { relationsRoute };
